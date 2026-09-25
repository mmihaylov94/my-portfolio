import assert from "node:assert/strict";
import { test } from "node:test";
import { SESSION, postJson, startApi } from "./helpers.js";

// How the chat routes deploy before the switch: present, answering, and off.

test("with no assistant configured, the chat routes are a 503 that names no setting", async (t) => {
	const api = await startApi(t, { portfolioAi: null });

	for (const [path, body] of [
		["/api/chat", { session_id: SESSION, message: "Hello" }],
		["/api/chat/feedback", { session_id: SESSION, message_id: 1, rating: 1 }],
	]) {
		const response = await postJson(`${api.url}${path}`, body);
		const { error } = await response.json();
		assert.equal(response.status, 503, path);
		assert.doesNotMatch(error, /PORTFOLIO|_URL|_KEY|\.env/i);
		// The limiter runs first, which is what lets TRUST_PROXY be checked while the
		// chat is still off.
		assert.ok(response.headers.get("ratelimit"), path);
	}
});

test("health answers whatever else is configured", async (t) => {
	const api = await startApi(t, { portfolioAi: null });

	const response = await fetch(`${api.url}/api/health`);

	assert.equal(response.status, 200);
	assert.deepEqual(await response.json(), { ok: true });
	assert.equal(response.headers.get("x-powered-by"), null);
});

test("an unknown API path is a JSON 404, and a stray icon request is logged", async (t) => {
	const api = await startApi(t, { portfolioAi: null });

	const unknown = await fetch(`${api.url}/api/nothing-here`);
	const icon = await fetch(`${api.url}/api/_nuxt_icon/heroicons.json?icons=x-mark`);

	assert.equal(unknown.status, 404);
	assert.deepEqual(await unknown.json(), { error: "Not found." });
	assert.equal(icon.status, 404);
	await icon.text();
	const line = api.lines.find((entry) => entry.event === "icon_request_reached_api");
	assert.equal(line.collection, "heroicons");
	assert.deepEqual(line.icons, ["x-mark"]);
});

test("a stray icon request logs icon names only, whatever else the URL carries", async (t) => {
	const api = await startApi(t, { portfolioAi: null });

	await (await fetch(`${api.url}/api/_nuxt_icon/heroicons.json?icons=x-mark,<script>,canary-9f2e&extra=canary-9f2e`)).text();
	await (await fetch(`${api.url}/api/_nuxt_icon/canary-secret-value/x.json`)).text();

	const line = api.lines.find((entry) => entry.event === "icon_request_reached_api");
	assert.deepEqual(line.icons, ["x-mark", "canary-9f2e"]);
	assert.ok(!api.logText().includes("<script>"));
	assert.ok(!api.logText().includes("canary-secret-value"));
});
