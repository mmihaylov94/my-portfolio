import assert from "node:assert/strict";
import { test } from "node:test";
import { postJson, startApi, startUpstream } from "./helpers.js";

const FORM = { email: "visitor@example.com", subject: "Hello", message: "A question.", reason: "other" };

function withWebhook(webhookUrl) {
	return { contact: { webhookUrl, apiKey: "n8n-key", webhookPath: "/contact", recaptchaSecret: null } };
}

test("without a webhook the form is unavailable, and the reply names no setting", async (t) => {
	const api = await startApi(t);

	const response = await postJson(`${api.url}/api/contact`, FORM);
	const { error } = await response.json();

	assert.equal(response.status, 503);
	assert.doesNotMatch(error, /N8N|WEBHOOK_URL|\.env/i);
});

test("a message is forwarded to the webhook with its key, and its reply passed back", async (t) => {
	const webhook = await startUpstream(t, (_req, res) => {
		res.writeHead(200, { "content-type": "application/json" });
		res.end(JSON.stringify({ ok: true }));
	});
	const api = await startApi(t, withWebhook(webhook.url));

	const response = await postJson(`${api.url}/api/contact`, { ...FORM, subject: "  Hello  " });

	assert.equal(response.status, 200);
	assert.deepEqual(await response.json(), { ok: true });
	const [call] = webhook.calls;
	assert.equal(call.url, "/contact");
	assert.equal(call.headers.apikey, "n8n-key");
	assert.deepEqual(JSON.parse(call.body), FORM);
});

test("a failing webhook's own response stays on the server", async (t) => {
	const webhook = await startUpstream(t, (_req, res) => {
		res.writeHead(500, { "content-type": "text/plain" });
		res.end("workflow crashed at node 7, credentials id 42");
	});
	const api = await startApi(t, withWebhook(webhook.url));

	const response = await postJson(`${api.url}/api/contact`, FORM);
	const text = await response.text();

	assert.equal(response.status, 500);
	assert.ok(!text.includes("credentials"), text);
});

test("a form with a field missing is refused", async (t) => {
	const api = await startApi(t, withWebhook("http://127.0.0.1:9"));

	const response = await postJson(`${api.url}/api/contact`, { ...FORM, reason: "  " });

	assert.equal(response.status, 400);
	await response.text();
});
