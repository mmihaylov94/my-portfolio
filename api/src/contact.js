import express from "express";
import { asyncRoute, createLimiter } from "./http.js";
import { codePoints, hasControlCharacter, stripWhiteSpace } from "./text.js";

// POST /api/contact: check the form, verify reCAPTCHA when it is configured, and hand
// the message to the assistant service (portfolio-ai). That service runs the spam
// checks, writes the acknowledgement to the visitor and emails the owner, and answers
// only once the owner's email has gone. The contract is docs/API.md in the
// portfolio-ai repository, "What the proxy has to do".
//
// Nothing a visitor typed goes into a log line: not the address, not the subject, not
// the message. One line per message handed over records how it went.

// The longest each field may be, in characters as Python counts them: the limits in
// portfolio-ai's api/schemas.py. Checked here first, so a refusal from the service
// for the shape of a body means the two sides' rules have drifted apart.
const MAX_CHARS = { email: 254, subject: 300, message: 5000, reason: 40 };

/** The four fields, trimmed and checked as the service checks them, or null. */
export function parseContactBody(body) {
	const value = {};
	for (const [field, maxChars] of Object.entries(MAX_CHARS)) {
		const raw = body?.[field];
		// Not well formed: half of a surrogate pair, which cutting a string in the wrong
		// place leaves behind, and which the service's parser cannot read.
		if (typeof raw !== "string" || !raw.isWellFormed()) return null;
		const text = stripWhiteSpace(raw);
		const length = codePoints(text);
		if (length === 0 || length > maxChars || hasControlCharacter(text)) return null;
		value[field] = text;
	}
	return value;
}

// Deliberately vague: these reach the public, and a setting's name or a mail server's
// complaint is a detail of the server, not something a visitor can act on.
const UNAVAILABLE = "The contact form is not available at the moment.";
const NOT_SENT = "Your message could not be sent. Please try again.";
const TOO_MANY = "Too many requests, please try again later.";

export function createContactRouter(config, { log }) {
	const { contact, portfolioAi, limits, timeouts } = config;
	const router = express.Router();

	const limiter = createLimiter({ ...limits.contact, message: TOO_MANY });

	async function verifyRecaptcha(token) {
		if (!contact.recaptchaSecret) return { success: true };
		if (!token || typeof token !== "string") return { success: false };
		// Nowhere to ask is a refusal and not a pass. loadConfig always gives the address;
		// a config object built without one, a test's say, must neither reach Google nor
		// let a form through unverified.
		if (!contact.recaptchaVerifyUrl) return { success: false };
		try {
			const params = new URLSearchParams({ secret: contact.recaptchaSecret, response: token });
			const response = await fetch(contact.recaptchaVerifyUrl, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: params.toString(),
				signal: AbortSignal.timeout(timeouts.recaptchaMs),
			});
			const data = await response.json();
			return { success: !!data.success, score: data.score };
		} catch (err) {
			log.error("recaptcha_verify_failed", { cause: err?.cause?.code ?? err?.name ?? null });
			return { success: false };
		}
	}

	// The service said no. Its status is turned into one a visitor can be shown, and
	// its own words stay on the server.
	function refuse(res, upstream, state) {
		const retryAfter = upstream.headers.get("retry-after");
		// Seconds only. An HTTP-date is legal but unexpected, and dropped rather than parsed.
		const retryHeaders = retryAfter && /^\d{1,6}$/.test(retryAfter) ? { "Retry-After": retryAfter } : {};

		switch (upstream.status) {
			case 429:
				// The service's own limit: by the hour, and for the whole site.
				res.status(429).set(retryHeaders).json({ error: TOO_MANY });
				return;
			case 503:
				// It is restarting, or its mail is not set up, or the email did not go.
				res.status(503).set(retryHeaders).json({ error: UNAVAILABLE });
				return;
			case 400:
			case 422:
				// Everything was checked here first, so the two sides' rules have drifted.
				state.outcome = "validation_mismatch";
				res.status(400).json({ error: NOT_SENT });
				return;
			case 401:
			case 403:
				// The keys on the two sides differ. Nothing about it goes to the browser.
				state.outcome = "auth_failed";
				res.status(502).json({ error: UNAVAILABLE });
				return;
			default:
				res.status(502).json({ error: NOT_SENT });
		}
	}

	async function handOver(payload, res) {
		if (!portfolioAi) {
			// Off until PORTFOLIO_AI_URL is set, like the chat.
			res.status(503).json({ error: UNAVAILABLE });
			return;
		}

		const started = Date.now();
		const state = { outcome: "completed", upstreamStatus: null, requestId: null, cause: null };
		try {
			let upstream;
			try {
				upstream = await fetch(`${portfolioAi.baseUrl}/v1/contact`, {
					method: "POST",
					headers: { Authorization: `Bearer ${portfolioAi.apiKey}`, "Content-Type": "application/json" },
					body: JSON.stringify(payload),
					signal: AbortSignal.timeout(timeouts.contactMs),
					// The key must never follow a redirect somewhere else.
					redirect: "error",
				});
			} catch (err) {
				if (err?.name === "TimeoutError") {
					// The service carries on with a message it has taken, so this one may
					// still arrive. The visitor is told it did not, and may send it twice.
					state.outcome = "timeout";
					res.status(504).json({ error: NOT_SENT });
				} else {
					state.outcome = "unreachable";
					state.cause = err?.cause?.code ?? err?.name ?? null;
					res.status(503).json({ error: UNAVAILABLE });
				}
				return;
			}

			state.upstreamStatus = upstream.status;
			state.requestId = upstream.headers.get("x-request-id");
			// Never read: nothing in it is for the visitor, and an unread body keeps its
			// pooled connection to the service busy.
			await upstream.body?.cancel().catch(() => {});
			if (upstream.ok) {
				res.json({ ok: true });
				return;
			}
			state.outcome = "upstream_error";
			refuse(res, upstream, state);
		} finally {
			const level = state.outcome === "completed" ? "info" : state.outcome === "auth_failed" ? "error" : "warn";
			log[level]("contact_submission", {
				request_id: state.requestId,
				status: res.headersSent ? res.statusCode : null,
				upstream_status: state.upstreamStatus,
				outcome: state.outcome,
				duration_ms: Date.now() - started,
				...(state.cause ? { cause: state.cause } : {}),
			});
		}
	}

	router.post("/contact", limiter, express.json({ limit: "1mb" }), asyncRoute(async (req, res) => {
		const payload = parseContactBody(req.body);
		if (!payload) {
			res.status(400).json({ error: "Missing or invalid: email, subject, message, reason" });
			return;
		}
		if (contact.recaptchaSecret) {
			const { recaptchaToken } = req.body;
			if (!recaptchaToken) {
				res.status(400).json({ error: "reCAPTCHA verification required" });
				return;
			}
			const { success, score } = await verifyRecaptcha(recaptchaToken);
			if (!success) {
				res.status(400).json({ error: "reCAPTCHA verification failed" });
				return;
			}
			if (typeof score === "number" && score < 0.5) {
				res.status(400).json({ error: "reCAPTCHA score too low" });
				return;
			}
		}
		await handOver(payload, res);
	}));

	return router;
}
