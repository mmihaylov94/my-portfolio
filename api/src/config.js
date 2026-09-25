import net from "node:net";
import express from "express";

// Everything the API reads from its environment, parsed once at startup. Nothing in
// this file runs on import, so tests build a config object of their own instead.

// How many proxies may sit in front of this API: Cloudflare, then Traefik. A larger
// count would let a visitor choose their own address by sending X-Forwarded-For.
const MAX_TRUSTED_HOPS = 2;

// The names Express's trust setting understands (proxy-addr), besides addresses.
const TRUST_KEYWORDS = new Set(["loopback", "linklocal", "uniquelocal"]);

// Narrower than these, a CIDR in TRUST_PROXY is plausibly a proxy's range. Wider, it
// is almost certainly a mistake that would trust half the internet.
const MIN_PREFIX = { 4: 8, 6: 16 };

// The service refuses keys shorter than this, so a shorter one can never work.
const MIN_API_KEY_LENGTH = 32;

const MINUTE = 60 * 1000;

export const DEFAULT_LIMITS = {
	contact: { limit: 5, windowMs: 15 * MINUTE },
	chat: { limit: 60, windowMs: 15 * MINUTE },
	feedback: { limit: 30, windowMs: 15 * MINUTE },
};

export const DEFAULT_TIMEOUTS = {
	// More than the assistant's admission can take before its first byte: two reads,
	// each of which can wait up to 30 s for a database connection. Once the stream has
	// started, a ping arrives after every 15 s of silence, so this is four missed pings.
	chatIdleMs: 65 * 1000,
	// Up to a minute of admission, the assistant's 120 s turn deadline, and a margin.
	chatOverallMs: 200 * 1000,
	feedbackMs: 10 * 1000,
	contactMs: 10 * 1000,
};

function problem(level, code, message) {
	return { level, code, message };
}

// IPv4 addresses as IPv6 sees them. Express compares an IPv4 visitor's address as
// ::ffff:a.b.c.d, so an IPv6 range reaching into this block trusts IPv4 addresses too.
const IPV4_MAPPED = new net.BlockList();
IPV4_MAPPED.addSubnet("::ffff:0:0", 96, "ipv6");

// How much of IPv4 an IPv6 range covers, as an IPv4 prefix length: 0 for all of it,
// 33 for none. "::/16" is short enough to pass the IPv6 minimum and covers all of it.
function ipv4PrefixOf(address, prefix) {
	if (prefix <= 96) {
		const range = new net.BlockList();
		range.addSubnet(address, prefix, "ipv6");
		return range.check("::ffff:0:0", "ipv6") ? 0 : 33;
	}
	return IPV4_MAPPED.check(address, "ipv6") ? prefix - 96 : 33;
}

function isTrustEntry(entry) {
	if (TRUST_KEYWORDS.has(entry)) return true;

	const parts = entry.split("/");
	if (parts.length > 2) return false;
	const [address, bits] = parts;
	const family = net.isIP(address);
	if (family === 0) return false;
	if (bits === undefined) return true;
	if (!/^\d{1,3}$/.test(bits)) return false;

	const prefix = Number(bits);
	if (prefix < MIN_PREFIX[family] || prefix > (family === 4 ? 32 : 128)) return false;
	return family === 4 || ipv4PrefixOf(address, prefix) >= MIN_PREFIX[4];
}

// The last word goes to the library that will use the value: an address can satisfy
// net.isIP and still be one Express's parser refuses ("64:ff9b::192.0.2.1"), which
// would otherwise stop the server at startup, contact form included.
function expressAccepts(trust) {
	try {
		express().set("trust proxy", trust);
		return true;
	} catch {
		return false;
	}
}

/**
 * Parse TRUST_PROXY into a value for Express's "trust proxy" setting.
 *
 * Every mistake falls back to trusting nothing, which is safe: every visitor then
 * shares one rate-limit bucket, and no visitor address is forwarded, rather than one
 * a visitor could have chosen. The value is never `true`, and a hop count is always
 * returned as a number, because Express reads the string "2" as the address 0.0.0.2.
 */
export function parseTrustProxy(raw) {
	const value = typeof raw === "string" ? raw.trim() : "";

	if (value === "") {
		return {
			trust: false,
			problem: problem(
				"warn",
				"trust_proxy_unset",
				"TRUST_PROXY is not set: every visitor shares one rate-limit bucket, and no visitor address is forwarded to the assistant.",
			),
		};
	}

	if (value === "false") return { trust: false, problem: null };

	if (/^\d+$/.test(value)) {
		const hops = Number(value);
		// "0" and "00" alike: a count of zero is false, not the number 0, which Express
		// would take as "trust the socket peer", Traefik's address for every visitor.
		if (hops === 0) return { trust: false, problem: null };
		if (hops <= MAX_TRUSTED_HOPS) return { trust: hops, problem: null };
		return {
			trust: false,
			problem: problem(
				"error",
				"trust_proxy_too_many_hops",
				`TRUST_PROXY=${hops} would let visitors choose their own address; at most ${MAX_TRUSTED_HOPS} proxies sit in front of this API. Trusting nothing instead.`,
			),
		};
	}

	const entries = value.split(",").map((entry) => entry.trim()).filter(Boolean);
	if (entries.length > 0 && entries.every(isTrustEntry) && expressAccepts(entries)) {
		return { trust: entries, problem: null };
	}

	return {
		trust: false,
		problem: problem(
			"error",
			"trust_proxy_invalid",
			"TRUST_PROXY must be 0, 1, 2, or a comma-separated list of addresses and ranges. Trusting nothing instead.",
		),
	};
}

function parseAssistant(rawUrl, rawKey, problems) {
	const urlValue = typeof rawUrl === "string" ? rawUrl.trim() : "";
	// Unset is not a problem: it is how the chat is deployed switched off.
	if (urlValue === "") return null;

	let url;
	try {
		url = new URL(urlValue);
	} catch {
		url = null;
	}
	if (!url || !["http:", "https:"].includes(url.protocol) || url.username || url.password) {
		problems.push(problem("error", "portfolio_ai_url_invalid", "PORTFOLIO_AI_URL must be an http(s) URL such as http://portfolio-ai:8000. The chat stays off."));
		return null;
	}

	const apiKey = typeof rawKey === "string" ? rawKey.trim() : "";
	if (apiKey.length < MIN_API_KEY_LENGTH) {
		problems.push(problem("error", "portfolio_ai_key_invalid", `PORTFOLIO_AI_API_KEY must be set and at least ${MIN_API_KEY_LENGTH} characters, identical to the assistant's own. The chat stays off.`));
		return null;
	}

	return { baseUrl: `${url.origin}${url.pathname.replace(/\/+$/, "")}`, apiKey };
}

export function loadConfig(env) {
	const problems = [];

	const trustProxy = parseTrustProxy(env.TRUST_PROXY);
	if (trustProxy.problem) problems.push(trustProxy.problem);

	return {
		port: Number(env.PORT || 3000),
		trustProxy: trustProxy.trust,
		portfolioAi: parseAssistant(env.PORTFOLIO_AI_URL, env.PORTFOLIO_AI_API_KEY, problems),
		contact: {
			webhookUrl: env.N8N_WEBHOOK_URL || null,
			apiKey: env.N8N_API_KEY || null,
			webhookPath: env.N8N_CONTACT_WEBHOOK_PATH || "/contact",
			recaptchaSecret: env.RECAPTCHA_SECRET_KEY || null,
		},
		limits: DEFAULT_LIMITS,
		timeouts: DEFAULT_TIMEOUTS,
		problems,
	};
}

export function describeTrust(trust) {
	if (trust === false) return "off";
	if (typeof trust === "number") return `${trust} hop${trust === 1 ? "" : "s"}`;
	return trust.join(",");
}
