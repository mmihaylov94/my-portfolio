import assert from "node:assert/strict";
import { test } from "node:test";
import { API_KEY, SESSION, assistant, closedUrl, postJson, startApi, startUpstream, waitFor } from "./helpers.js";

// The assistant refused before any answer began. What the visitor sees, and what
// stays on the server.

const UNAVAILABLE = "The assistant is unavailable right now. Please try again in a moment.";

const CASES = [
	{
		name: "409 passes its sentence through",
		status: 409,
		body: { detail: "A reply in this conversation is still being written." },
		expect: { status: 409, error: "A reply in this conversation is still being written.", retryAfter: null },
	},
	{
		name: "429 keeps its Retry-After",
		status: 429,
		headers: { "retry-after": "42" },
		body: { detail: "That is a lot of questions in a short time. Please wait a little." },
		expect: { status: 429, error: "That is a lot of questions in a short time. Please wait a little.", retryAfter: "42" },
	},
	{
		name: "503 while busy keeps its Retry-After",
		status: 503,
		headers: { "retry-after": "5" },
		body: { detail: "The assistant is busy. Please try again in a moment." },
		expect: { status: 503, error: "The assistant is busy. Please try again in a moment.", retryAfter: "5" },
	},
	{
		name: "503 without Retry-After stays without one",
		status: 503,
		body: { detail: UNAVAILABLE },
		expect: { status: 503, error: UNAVAILABLE, retryAfter: null },
	},
	{
		name: "a Retry-After that is a date is dropped",
		status: 429,
		headers: { "retry-after": "Wed, 21 Oct 2015 07:28:00 GMT" },
		body: { detail: "That is a lot of questions in a short time. Please wait a little." },
		expect: { status: 429, error: "That is a lot of questions in a short time. Please wait a little.", retryAfter: null },
	},
	{
		name: "422 becomes a plain 400 and is logged as drift",
		status: 422,
		body: { detail: [{ loc: ["body", "message"], msg: "String should have at most 2000 characters", type: "string_too_long" }] },
		expect: { status: 400, error: "That message could not be sent.", retryAfter: null, logged: "upstream_validation_mismatch" },
	},
	{
		name: "401 becomes 502, and the key is never mentioned",
		status: 401,
		body: { detail: "Missing or invalid API key." },
		expect: { status: 502, error: UNAVAILABLE, retryAfter: null, logged: "upstream_auth_failed" },
	},
	{
		name: "500 becomes 502",
		status: 500,
		body: { detail: "Something went wrong on our side." },
		expect: { status: 502, error: "Something went wrong on our side. Please try again.", retryAfter: null },
	},
	{
		name: "an HTML error page becomes 502 without its contents",
		status: 502,
		raw: "<html><body>Bad gateway from somewhere internal</body></html>",
		expect: { status: 502, error: "Something went wrong on our side. Please try again.", retryAfter: null },
	},
];

for (const example of CASES) {
	test(`upstream ${example.name}`, async (t) => {
		const upstream = await startUpstream(t, (_req, res) => {
			res.writeHead(example.status, {
				"content-type": example.raw ? "text/html" : "application/json",
				"x-request-id": "req-error",
				...example.headers,
			});
			res.end(example.raw ?? JSON.stringify(example.body));
		});
		const api = await startApi(t, { portfolioAi: assistant(upstream.url) });

		const response = await postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" });
		const text = await response.text();

		assert.equal(response.status, example.expect.status);
		assert.deepEqual(JSON.parse(text), { error: example.expect.error });
		assert.equal(response.headers.get("retry-after"), example.expect.retryAfter);
		assert.ok(!text.includes(API_KEY) && ![...response.headers.values()].some((value) => value.includes(API_KEY)));
		assert.ok(!text.includes("internal"));
		if (example.expect.logged) {
			await waitFor(() => api.lines.find((line) => line.event === example.expect.logged && line.request_id === "req-error"));
		}
	});
}

test("a huge error body is not read to the end", { timeout: 3000 }, async (t) => {
	const upstream = await startUpstream(t, (_req, res) => {
		res.writeHead(500, { "content-type": "application/json" });
		res.write("x".repeat(64 * 1024));
		// ...and never ends: only a capped read answers in time.
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url) });

	const response = await postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" });

	assert.equal(response.status, 502);
	await response.text();
});

test("an assistant that cannot be reached is a 503 that names nothing internal", async (t) => {
	const api = await startApi(t, { portfolioAi: assistant(await closedUrl()) });

	const response = await postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" });

	assert.equal(response.status, 503);
	assert.deepEqual(await response.json(), { error: UNAVAILABLE });
	await waitFor(() => api.lines.find((line) => line.outcome === "unreachable" && line.cause === "ECONNREFUSED"));
});

test("a success that is not a stream is treated as an error", async (t) => {
	const upstream = await startUpstream(t, (_req, res) => {
		res.writeHead(200, { "content-type": "application/json" });
		res.end(JSON.stringify({ reply: "Hi" }));
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url) });

	const response = await postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" });

	assert.equal(response.status, 502);
	await response.text();
});

test("the assistant taking too long to start is a 504", { timeout: 3000 }, async (t) => {
	const upstream = await startUpstream(t, () => {
		// Never answers.
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url), timeouts: { chatIdleMs: 200 } });

	const response = await postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" });

	assert.equal(response.status, 504);
	assert.match((await response.json()).error, /took too long/);
});
