import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import { describeTrust, loadConfig, parseTrustProxy } from "../src/config.js";

const KEY = "k".repeat(32);

test("an unset TRUST_PROXY trusts nothing, and says what that costs", () => {
	const { trust, problem } = parseTrustProxy(undefined);

	assert.equal(trust, false);
	assert.equal(problem.level, "warn");
	assert.equal(problem.code, "trust_proxy_unset");
});

test("a hop count is a number, never the string Express would read as an address", () => {
	for (const [raw, hops] of [["1", 1], ["2", 2], [" 2 ", 2]]) {
		const { trust, problem } = parseTrustProxy(raw);
		assert.equal(trust, hops);
		assert.equal(typeof trust, "number");
		assert.equal(problem, null);
	}
});

test("zero and false trust nothing, deliberately and without a warning", () => {
	// "00" too: a count of zero must be false, not the number 0, which Express takes
	// as "trust the socket peer", Traefik's address for every visitor.
	for (const raw of ["0", "00", "false"]) {
		assert.deepEqual(parseTrustProxy(raw), { trust: false, problem: null });
	}
});

test("anything that would let a visitor choose their address falls back to trusting nothing", () => {
	const refused = [
		"3", "10", "true", "*", "0.0.0.0/0", "::/0", "10.0.0.0/4", "999.1.1.1", "2x", "1,2", "loopback,true",
		"10.0.0.0/255.0.0.0",
		// IPv6 ranges that reach into ::ffff:0:0/96 trust IPv4 visitors too: all of them here.
		"::/16", "::ffff:0.0.0.0/96", "::ffff:0.0.0.0/100",
		// Valid to net.isIP, refused by the parser Express uses, which would stop startup.
		"::1.2.3.4", "64:ff9b::192.0.2.1", "fe80::%a.b/64",
	];
	for (const raw of refused) {
		const { trust, problem } = parseTrustProxy(raw);
		assert.equal(trust, false, raw);
		assert.equal(problem?.level, "error", raw);
	}
});

test("a list of keywords, addresses and ranges is accepted as a list", () => {
	const { trust, problem } = parseTrustProxy("uniquelocal, 198.51.100.0/24, 2001:db8::/32, 192.0.2.1, ::ffff:192.0.2.0/120");

	assert.deepEqual(trust, ["uniquelocal", "198.51.100.0/24", "2001:db8::/32", "192.0.2.1", "::ffff:192.0.2.0/120"]);
	assert.equal(problem, null);
});

test("every value the parser produces is one Express accepts", () => {
	for (const raw of [undefined, "0", "00", "1", "2", "loopback,198.51.100.0/24", "true", "3", "nonsense", "64:ff9b::192.0.2.1", "::/16"]) {
		assert.doesNotThrow(() => express().set("trust proxy", parseTrustProxy(raw).trust), String(raw));
	}
});

test("describeTrust names the setting for the startup log", () => {
	assert.equal(describeTrust(false), "off");
	assert.equal(describeTrust(1), "1 hop");
	assert.equal(describeTrust(2), "2 hops");
	assert.equal(describeTrust(["uniquelocal", "192.0.2.1"]), "uniquelocal,192.0.2.1");
});

test("without PORTFOLIO_AI_URL the chat is off, which is not a problem", () => {
	const config = loadConfig({ TRUST_PROXY: "2" });

	assert.equal(config.portfolioAi, null);
	assert.deepEqual(config.problems, []);
});

test("a URL and a long enough key switch the chat on", () => {
	const config = loadConfig({ TRUST_PROXY: "2", PORTFOLIO_AI_URL: "http://portfolio-ai:8000/", PORTFOLIO_AI_API_KEY: KEY });

	assert.deepEqual(config.portfolioAi, { baseUrl: "http://portfolio-ai:8000", apiKey: KEY });
});

test("a URL without a usable key keeps the chat off, and says so", () => {
	for (const key of [undefined, "", "short"]) {
		const config = loadConfig({ TRUST_PROXY: "2", PORTFOLIO_AI_URL: "http://portfolio-ai:8000", PORTFOLIO_AI_API_KEY: key });
		assert.equal(config.portfolioAi, null);
		assert.equal(config.problems[0].code, "portfolio_ai_key_invalid");
	}
});

test("a URL that is not http(s) keeps the chat off, and says so", () => {
	for (const url of ["portfolio-ai:8000", "ftp://portfolio-ai", "http://user:secret@portfolio-ai:8000", "not a url"]) {
		const config = loadConfig({ TRUST_PROXY: "2", PORTFOLIO_AI_URL: url, PORTFOLIO_AI_API_KEY: KEY });
		assert.equal(config.portfolioAi, null, url);
		assert.equal(config.problems[0].code, "portfolio_ai_url_invalid", url);
	}
});
