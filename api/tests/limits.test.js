import assert from "node:assert/strict";
import { test } from "node:test";
import { SESSION, rawPost, startApi } from "./helpers.js";

// The per-address limits. Run against routes that are switched off (503), because
// the limiter comes first and counts every request either way.

const CHAT = { session_id: SESSION, message: "Hello" };
const WINDOW = 60 * 1000;

test("past the chat limit, requests get a JSON 429 with Retry-After", async (t) => {
	const api = await startApi(t, { limits: { chat: { limit: 3, windowMs: WINDOW } } });

	const statuses = [];
	for (let i = 0; i < 3; i++) statuses.push((await rawPost(`${api.url}/api/chat`, i === 0 ? "not json" : CHAT)).status);
	const refused = await rawPost(`${api.url}/api/chat`, CHAT);

	// Invalid requests count too: the limit is on what arrives, not on what is valid.
	assert.deepEqual(statuses, [503, 503, 503]);
	assert.equal(refused.status, 429);
	assert.equal(typeof JSON.parse(refused.text).error, "string");
	assert.ok(refused.headers["retry-after"]);
	assert.ok(refused.headers.ratelimit);
});

test("with the proxies trusted, each visitor address has its own bucket", async (t) => {
	const api = await startApi(t, { trustProxy: 1, limits: { chat: { limit: 1, windowMs: WINDOW } } });
	const from = (address) => rawPost(`${api.url}/api/chat`, CHAT, { "X-Forwarded-For": address });

	assert.equal((await from("203.0.113.1")).status, 503);
	assert.equal((await from("203.0.113.1")).status, 429);
	assert.equal((await from("203.0.113.2")).status, 503);
});

test("with nothing trusted, X-Forwarded-For is ignored, quietly", async (t) => {
	const errors = t.mock.method(console, "error", () => {});
	const api = await startApi(t, { trustProxy: false, limits: { chat: { limit: 1, windowMs: WINDOW } } });
	const from = (address) => rawPost(`${api.url}/api/chat`, CHAT, { "X-Forwarded-For": address });

	assert.equal((await from("203.0.113.1")).status, 503);
	// A different claimed address is still the same bucket: the header is not believed.
	assert.equal((await from("203.0.113.2")).status, 429);
	// The library's own check for this case is off; the startup warning says it instead.
	assert.equal(errors.mock.callCount(), 0);
});

test("chat and feedback are counted separately", async (t) => {
	const api = await startApi(t, { limits: { chat: { limit: 1, windowMs: WINDOW } } });

	await rawPost(`${api.url}/api/chat`, CHAT);
	assert.equal((await rawPost(`${api.url}/api/chat`, CHAT)).status, 429);

	const feedback = await rawPost(`${api.url}/api/chat/feedback`, { session_id: SESSION, message_id: 1, rating: 1 });
	assert.equal(feedback.status, 503);
});
