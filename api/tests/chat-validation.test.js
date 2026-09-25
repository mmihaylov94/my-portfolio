import assert from "node:assert/strict";
import { test } from "node:test";
import { DONE, SESSION, assistant, postJson, rawPost, sse, startApi, startUpstream, upstreamEventStream } from "./helpers.js";

// Everything is checked here the way the assistant checks it (schemas.py), so a
// message it would refuse never costs a round trip, and one it would accept is never
// refused here.

async function withUpstream(t) {
	const upstream = await startUpstream(t, (_req, res) => {
		upstreamEventStream(res);
		res.end(sse("done", DONE));
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url) });
	return { api, upstream };
}

async function send(api, body) {
	const response = await postJson(`${api.url}/api/chat`, body);
	return { status: response.status, text: await response.text() };
}

test("session ids the assistant would refuse are refused here", async (t) => {
	const { api, upstream } = await withUpstream(t);

	for (const sessionId of ["short", "has spaces in it", "a".repeat(101), "semi;colon", 12345678, null, undefined]) {
		const { status } = await send(api, { session_id: sessionId, message: "Hello" });
		assert.equal(status, 400, String(sessionId));
	}
	assert.equal(upstream.calls.length, 0);
});

test("empty, oversized and control-character messages are refused before the assistant", async (t) => {
	const { api, upstream } = await withUpstream(t);

	for (const message of ["", "   \n\t ", "a".repeat(2001), "😀".repeat(2001), "Hello\u0000there", "\u001chi", 42, null]) {
		const { status, text } = await send(api, { session_id: SESSION, message });
		assert.equal(status, 400, JSON.stringify(message));
		assert.equal(typeof JSON.parse(text).error, "string");
	}
	assert.equal(upstream.calls.length, 0);
});

test("a field the assistant does not know is refused, not quietly dropped", async (t) => {
	const { api, upstream } = await withUpstream(t);

	const { status } = await send(api, { session_id: SESSION, message: "Hello", sesion_id: SESSION });

	assert.equal(status, 400);
	assert.equal(upstream.calls.length, 0);
});

test("half of a surrogate pair is refused here, as the assistant refuses it", async (t) => {
	const { api, upstream } = await withUpstream(t);
	const high = String.fromCharCode(0xd800);
	const low = String.fromCharCode(0xdc00);

	for (const message of [`a${high}`, `${low}b`, high]) {
		assert.equal((await send(api, { session_id: SESSION, message })).status, 400);
	}
	// A whole pair is one character, and fine.
	assert.equal((await send(api, { session_id: SESSION, message: `a${high}${low}` })).status, 200);
	assert.equal(upstream.calls.length, 1);
});

test("the longest message allowed is 2,000 characters as Python counts them", async (t) => {
	const { api, upstream } = await withUpstream(t);

	assert.equal((await send(api, { session_id: SESSION, message: "a".repeat(2000) })).status, 200);
	// 2,000 code points, 4,000 UTF-16 units: an emoji is one character to the assistant.
	assert.equal((await send(api, { session_id: SESSION, message: "😀".repeat(2000) })).status, 200);

	assert.equal(JSON.parse(upstream.calls[1].body).message, "😀".repeat(2000));
});

test("whitespace is trimmed exactly as the assistant trims it", async (t) => {
	const { api, upstream } = await withUpstream(t);

	await send(api, { session_id: SESSION, message: "\u0085\u3000Hi\u00a0\n" });
	await send(api, { session_id: SESSION, message: "\ufeffHi" });

	// U+0085 and U+3000 are Unicode white space and go; U+FEFF is not, and stays,
	// although JavaScript's own trim() would have removed it.
	assert.equal(JSON.parse(upstream.calls[0].body).message, "Hi");
	assert.equal(JSON.parse(upstream.calls[1].body).message, "\ufeffHi");
});

test("a body too large for any message is a JSON 413", async (t) => {
	const { api, upstream } = await withUpstream(t);

	const { status, text } = await send(api, { session_id: SESSION, message: "a".repeat(40 * 1024) });

	assert.equal(status, 413);
	assert.equal(typeof JSON.parse(text).error, "string");
	assert.equal(upstream.calls.length, 0);
});

test("malformed JSON, and anything that is not JSON, is a JSON 400", async (t) => {
	const { api, upstream } = await withUpstream(t);

	const malformed = await rawPost(`${api.url}/api/chat`, "{\"session_id\": ");
	const plain = await rawPost(`${api.url}/api/chat`, "session_id=abc", { "Content-Type": "text/plain" });

	assert.equal(malformed.status, 400);
	assert.equal(typeof JSON.parse(malformed.text).error, "string");
	assert.equal(plain.status, 400);
	assert.equal(typeof JSON.parse(plain.text).error, "string");
	assert.equal(upstream.calls.length, 0);
});

test("nothing a visitor sends ever reaches the log", async (t) => {
	const { api } = await withUpstream(t);
	const message = "canary-message-5b1f";
	const sessionId = "canary-session-9d2e";

	await send(api, { session_id: sessionId, message });
	await rawPost(`${api.url}/api/chat`, `{"session_id": "${sessionId}", "message": "${message}"`);
	await send(api, { session_id: sessionId, message: `${message}\u0000` });

	assert.ok(api.lines.length > 0);
	assert.ok(!api.logText().includes("canary"), api.logText());
});
