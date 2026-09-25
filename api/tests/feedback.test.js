import assert from "node:assert/strict";
import { test } from "node:test";
import { API_KEY, SESSION, assistant, closedUrl, postJson, startApi, startUpstream } from "./helpers.js";

async function withUpstream(t, status = 204, body = "") {
	const upstream = await startUpstream(t, (_req, res) => {
		res.writeHead(status, body ? { "content-type": "application/json" } : {});
		res.end(body);
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url) });
	return { api, upstream };
}

function send(api, body) {
	return postJson(`${api.url}/api/chat/feedback`, body);
}

test("feedback goes to the answer's own URL, with exactly the fields the assistant takes", async (t) => {
	const { api, upstream } = await withUpstream(t);

	const response = await send(api, { session_id: SESSION, message_id: 42, rating: -1, comment: "  Missing the dates. " });

	assert.equal(response.status, 204);
	assert.equal(await response.text(), "");
	const [call] = upstream.calls;
	assert.equal(call.url, "/v1/messages/42/feedback");
	assert.equal(call.headers.authorization, `Bearer ${API_KEY}`);
	assert.deepEqual(JSON.parse(call.body), { session_id: SESSION, rating: -1, comment: "Missing the dates." });
});

test("a blank or missing comment is left out", async (t) => {
	const { api, upstream } = await withUpstream(t);

	await send(api, { session_id: SESSION, message_id: 1, rating: 1, comment: "   " });
	await send(api, { session_id: SESSION, message_id: 1, rating: 1, comment: null });
	await send(api, { session_id: SESSION, message_id: 1, rating: 1 });

	for (const call of upstream.calls) {
		assert.deepEqual(JSON.parse(call.body), { session_id: SESSION, rating: 1 });
	}
});

test("only a positive whole number ever becomes part of the URL", async (t) => {
	const { api, upstream } = await withUpstream(t);

	for (const messageId of ["42", 0, -1, 1.5, 2 ** 53, true, null, "1/../../chat/stream", [1], undefined]) {
		const response = await send(api, { session_id: SESSION, message_id: messageId, rating: 1 });
		assert.equal(response.status, 400, JSON.stringify(messageId));
		await response.text();
	}
	assert.equal(upstream.calls.length, 0);
});

test("a rating is exactly 1 or -1", async (t) => {
	const { api, upstream } = await withUpstream(t);

	for (const rating of [true, false, 0, 2, "1", null]) {
		const response = await send(api, { session_id: SESSION, message_id: 3, rating });
		assert.equal(response.status, 400, JSON.stringify(rating));
		await response.text();
	}
	assert.equal(upstream.calls.length, 0);
});

test("a misspelt field is refused rather than dropped, so a comment is never lost quietly", async (t) => {
	const { api, upstream } = await withUpstream(t);

	const response = await send(api, { session_id: SESSION, message_id: 3, rating: -1, comments: "Wrong dates." });

	assert.equal(response.status, 400);
	await response.text();
	assert.equal(upstream.calls.length, 0);
});

test("comments the assistant would refuse are refused here", async (t) => {
	const { api, upstream } = await withUpstream(t);

	for (const comment of ["a".repeat(1001), `bad${String.fromCharCode(7)}bell`, `half ${String.fromCharCode(0xd83d)}`, 42]) {
		const response = await send(api, { session_id: SESSION, message_id: 3, rating: -1, comment });
		assert.equal(response.status, 400, JSON.stringify(comment));
		await response.text();
	}
	assert.equal(upstream.calls.length, 0);
});

test("an answer that is not in this conversation is a 404 with the assistant's sentence", async (t) => {
	const { api } = await withUpstream(t, 404, JSON.stringify({ detail: "There is no such answer in this conversation." }));

	const response = await send(api, { session_id: SESSION, message_id: 9, rating: 1 });

	assert.equal(response.status, 404);
	assert.deepEqual(await response.json(), { error: "There is no such answer in this conversation." });
});

test("an assistant that cannot be reached is a 503", async (t) => {
	const api = await startApi(t, { portfolioAi: assistant(await closedUrl()) });

	const response = await send(api, { session_id: SESSION, message_id: 9, rating: 1 });

	assert.equal(response.status, 503);
	await response.text();
});
