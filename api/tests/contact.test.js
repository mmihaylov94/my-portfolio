import assert from "node:assert/strict";
import { test } from "node:test";
import { API_KEY, assistant, closedUrl, postJson, startApi, startUpstream } from "./helpers.js";

// The contact form: checked here, then handed to the assistant service, which emails
// the owner. What is forwarded, what each of the service's answers becomes, and what
// stays out of the reply and out of the log.

const FORM = { email: "visitor@example.com", subject: "Hello", message: "A question.", reason: "other" };

function received(_req, res) {
	res.writeHead(200, { "content-type": "application/json", "x-request-id": "req-contact" });
	res.end(JSON.stringify({ status: "received" }));
}

test("without the assistant the form is unavailable, and the reply names no setting", async (t) => {
	const api = await startApi(t);

	const response = await postJson(`${api.url}/api/contact`, FORM);
	const { error } = await response.json();

	assert.equal(response.status, 503);
	assert.doesNotMatch(error, /PORTFOLIO|_URL|_KEY|N8N|\.env/i);
});

test("a message is handed to the assistant with its key, trimmed, and with nothing else", async (t) => {
	const service = await startUpstream(t, received);
	const api = await startApi(t, { portfolioAi: assistant(service.url) });

	const response = await postJson(`${api.url}/api/contact`, {
		...FORM,
		subject: "  Hello  ",
		message: "A question.\n",
		recaptchaToken: "a-token-from-the-browser",
		phone: "not a field of the form",
	});

	assert.equal(response.status, 200);
	// The service's own answer is not passed on: the form needs to know one thing.
	assert.deepEqual(await response.json(), { ok: true });
	assert.equal(service.calls.length, 1);
	const [call] = service.calls;
	assert.equal(call.method, "POST");
	assert.equal(call.url, "/v1/contact");
	assert.equal(call.headers.authorization, `Bearer ${API_KEY}`);
	assert.deepEqual(JSON.parse(call.body), FORM);
});

const REFUSALS = [
	{ name: "its hourly limit keeps its Retry-After", status: 429, headers: { "retry-after": "1800" }, expect: { status: 429, retryAfter: "1800", outcome: "upstream_error", level: "warn" } },
	{ name: "a Retry-After that is a date is dropped", status: 429, headers: { "retry-after": "Wed, 21 Oct 2015 07:28:00 GMT" }, expect: { status: 429, retryAfter: null, outcome: "upstream_error", level: "warn" } },
	{ name: "restarting keeps its Retry-After", status: 503, headers: { "retry-after": "5" }, expect: { status: 503, retryAfter: "5", outcome: "upstream_error", level: "warn" } },
	{ name: "mail that did not go is a 503 without one", status: 503, expect: { status: 503, retryAfter: null, outcome: "upstream_error", level: "warn" } },
	{ name: "a body it refuses is a plain 400, logged as drift", status: 422, expect: { status: 400, retryAfter: null, outcome: "validation_mismatch", level: "warn" } },
	{ name: "a key it refuses is a 502, logged as an error", status: 401, expect: { status: 502, retryAfter: null, outcome: "auth_failed", level: "error" } },
	{ name: "a failure of its own is a 502", status: 500, expect: { status: 502, retryAfter: null, outcome: "upstream_error", level: "warn" } },
	{ name: "anything unexpected is a 502", status: 404, expect: { status: 502, retryAfter: null, outcome: "upstream_error", level: "warn" } },
];

for (const { name, status, headers = {}, expect } of REFUSALS) {
	test(`when the assistant refuses: ${name}`, async (t) => {
		const service = await startUpstream(t, (_req, res) => {
			res.writeHead(status, { "content-type": "application/json", "x-request-id": "req-refused", ...headers });
			// Words of the kind the service really uses, none of which is for a visitor.
			res.end(JSON.stringify({ detail: "The contact form cannot send. Not set: CONTACT_TO_EMAIL. The mail server said credentials 535." }));
		});
		const api = await startApi(t, { portfolioAi: assistant(service.url) });

		const response = await postJson(`${api.url}/api/contact`, FORM);
		const text = await response.text();

		assert.equal(response.status, expect.status);
		assert.equal(response.headers.get("retry-after"), expect.retryAfter);
		assert.equal(typeof JSON.parse(text).error, "string");
		for (const secret of ["CONTACT_TO_EMAIL", "credentials", "535", "mail server", API_KEY]) {
			assert.ok(!text.includes(secret), text);
		}
		const [line] = api.lines.filter((entry) => entry.event === "contact_submission");
		assert.equal(line.level, expect.level);
		assert.equal(line.outcome, expect.outcome);
		assert.equal(line.status, expect.status);
		assert.equal(line.upstream_status, status);
		assert.equal(line.request_id, "req-refused");
	});
}

const LONE_SURROGATE = String.fromCharCode(0xd83d);
const NUL = String.fromCharCode(0);
const DELETE = String.fromCharCode(0x7f);
const NEXT_LINE = String.fromCharCode(0x85);

const UNFIT = [
	["a field missing", { email: FORM.email, subject: FORM.subject, message: FORM.message }],
	["a field of spaces", { ...FORM, reason: "  " }],
	// White space as the service trims it: JavaScript's trim() would leave this one.
	["a field of white space JavaScript does not trim", { ...FORM, message: NEXT_LINE }],
	["a field that is not text", { ...FORM, message: 5 }],
	["a message too long", { ...FORM, message: "x".repeat(5001) }],
	["a subject too long", { ...FORM, subject: "x".repeat(301) }],
	["an address too long", { ...FORM, email: "x".repeat(255) }],
	["a reason too long", { ...FORM, reason: "x".repeat(41) }],
	["a control character", { ...FORM, message: `Hello${NUL}there` }],
	["a delete character", { ...FORM, reason: `other${DELETE}` }],
	["half a surrogate pair", { ...FORM, subject: `Hello${LONE_SURROGATE}` }],
	["a list", [FORM]],
];

for (const [name, body] of UNFIT) {
	test(`a form that does not fit is refused here and the assistant never asked: ${name}`, async (t) => {
		const service = await startUpstream(t, received);
		const api = await startApi(t, { portfolioAi: assistant(service.url) });

		const response = await postJson(`${api.url}/api/contact`, body);
		await response.text();

		assert.equal(response.status, 400);
		assert.equal(service.calls.length, 0);
	});
}

test("each field may be exactly as long as its limit, counted in characters as the assistant counts", async (t) => {
	const service = await startUpstream(t, received);
	const api = await startApi(t, { portfolioAi: assistant(service.url) });
	// An emoji is one character to Python and two units of a JavaScript string, so
	// 5,000 of them are within the limit although their .length is 10,000.
	const emoji = String.fromCodePoint(0x1f600);
	const longest = {
		email: "x".repeat(254),
		subject: "x".repeat(300),
		message: emoji.repeat(5000),
		reason: "x".repeat(40),
	};

	const response = await postJson(`${api.url}/api/contact`, longest);
	await response.text();

	assert.equal(response.status, 200);
	assert.deepEqual(JSON.parse(service.calls[0].body), longest);
});

test("an assistant that cannot be reached is a 503", async (t) => {
	const api = await startApi(t, { portfolioAi: assistant(await closedUrl()) });

	const response = await postJson(`${api.url}/api/contact`, FORM);
	await response.text();

	assert.equal(response.status, 503);
	const [line] = api.lines.filter((entry) => entry.event === "contact_submission");
	assert.equal(line.outcome, "unreachable");
	assert.equal(line.cause, "ECONNREFUSED");
	assert.equal(line.upstream_status, null);
});

test("an assistant that takes too long is a 504, after the contact form's own wait", async (t) => {
	// Never answers. The helper closes its connections when the test ends.
	const service = await startUpstream(t, () => new Promise(() => {}));
	const api = await startApi(t, { portfolioAi: assistant(service.url), timeouts: { contactMs: 150 } });
	const started = Date.now();

	const response = await postJson(`${api.url}/api/contact`, FORM);
	await response.text();

	assert.equal(response.status, 504);
	assert.equal(api.lines.find((entry) => entry.event === "contact_submission").outcome, "timeout");
	// contactMs and no other wait: 150 ms here, where the reCAPTCHA timeout is 10 s. That
	// it fired at all would pass with any timeout wired in; how soon it fired does not.
	assert.ok(Date.now() - started < 1500, "gave up on contactMs");
});

test("a redirect is not followed, so the key goes nowhere else", async (t) => {
	const elsewhere = await startUpstream(t, received);
	const service = await startUpstream(t, (_req, res) => {
		res.writeHead(307, { location: `${elsewhere.url}/v1/contact` });
		res.end();
	});
	const api = await startApi(t, { portfolioAi: assistant(service.url) });

	const response = await postJson(`${api.url}/api/contact`, FORM);
	await response.text();

	assert.equal(response.status, 503);
	assert.equal(elsewhere.calls.length, 0);
});

test("nothing a visitor typed is in the log, whether the message went or not", async (t) => {
	const typed = {
		email: "canary-address@example.com",
		subject: "canary-subject",
		message: "canary-message",
		reason: "canary-reason",
	};
	const service = await startUpstream(t, received);
	const failing = await startUpstream(t, (_req, res) => {
		res.writeHead(500, { "content-type": "application/json" });
		res.end("{}");
	});
	const api = await startApi(t, { portfolioAi: assistant(service.url) });
	const broken = await startApi(t, { portfolioAi: assistant(failing.url) });

	await (await postJson(`${api.url}/api/contact`, typed)).text();
	await (await postJson(`${broken.url}/api/contact`, typed)).text();
	// One refused here too, before it was ever handed over.
	await (await postJson(`${api.url}/api/contact`, { ...typed, message: "canary-message".repeat(500) })).text();

	const [line] = api.lines.filter((entry) => entry.event === "contact_submission");
	assert.equal(line.level, "info");
	assert.equal(line.outcome, "completed");
	assert.equal(line.status, 200);
	assert.equal(line.upstream_status, 200);
	assert.equal(line.request_id, "req-contact");
	assert.equal(typeof line.duration_ms, "number");
	assert.equal(broken.lines.filter((entry) => entry.event === "contact_submission").length, 1);
	for (const log of [api.logText(), broken.logText()]) {
		assert.ok(!log.includes("canary"), log);
		assert.ok(!log.includes(API_KEY), log);
	}
});

test("the form's own limit turns a visitor away before the assistant is asked", async (t) => {
	const service = await startUpstream(t, received);
	const api = await startApi(t, {
		portfolioAi: assistant(service.url),
		limits: { contact: { limit: 1, windowMs: 60 * 1000 } },
	});

	const first = await postJson(`${api.url}/api/contact`, FORM);
	const second = await postJson(`${api.url}/api/contact`, FORM);
	await first.text();
	await second.text();

	assert.equal(first.status, 200);
	assert.equal(second.status, 429);
	assert.equal(service.calls.length, 1);
});

// reCAPTCHA, with a stand-in where Google is. The address a token is verified at is
// part of the config object for this reason.

const SECRET = "a-recaptcha-secret-for-these-tests";

async function withRecaptcha(t, verify, overrides = {}) {
	const google = await startUpstream(t, verify);
	const service = await startUpstream(t, received);
	const api = await startApi(t, {
		portfolioAi: assistant(service.url),
		contact: { recaptchaSecret: SECRET, recaptchaVerifyUrl: `${google.url}/siteverify` },
		...overrides,
	});
	return { google, service, api };
}

function verdict(answer) {
	return (_req, res) => {
		res.writeHead(200, { "content-type": "application/json" });
		res.end(JSON.stringify(answer));
	};
}

test("with reCAPTCHA on, a form without a token is refused, and neither Google nor the assistant is asked", async (t) => {
	const { google, service, api } = await withRecaptcha(t, verdict({ success: true, score: 0.9 }));

	const response = await postJson(`${api.url}/api/contact`, FORM);
	const { error } = await response.json();

	assert.equal(response.status, 400);
	// The form looks for this word to say that verification failed.
	assert.match(error, /recaptcha/i);
	assert.equal(google.calls.length, 0);
	assert.equal(service.calls.length, 0);
});

const VERDICTS = [
	{ name: "a good score lets the form through", answer: { success: true, score: 0.9 }, status: 200 },
	{ name: "a score of exactly 0.5 lets it through", answer: { success: true, score: 0.5 }, status: 200 },
	{ name: "a score just under 0.5 is refused", answer: { success: true, score: 0.49 }, status: 400 },
	{ name: "a token Google does not accept is refused, whatever its score", answer: { success: false, score: 0.9 }, status: 400 },
];

for (const { name, answer, status } of VERDICTS) {
	test(`with reCAPTCHA on: ${name}`, async (t) => {
		const { google, service, api } = await withRecaptcha(t, verdict(answer));

		const response = await postJson(`${api.url}/api/contact`, { ...FORM, recaptchaToken: "a-token-from-the-browser" });
		const text = await response.text();

		assert.equal(response.status, status);
		// What Google is asked: the secret and the token, as a form, and nothing typed.
		const [asked] = google.calls;
		assert.equal(asked.method, "POST");
		assert.equal(asked.url, "/siteverify");
		assert.deepEqual(Object.fromEntries(new URLSearchParams(asked.body)), { secret: SECRET, response: "a-token-from-the-browser" });
		if (status === 200) {
			// The token stops here: the assistant is handed the four fields.
			assert.deepEqual(JSON.parse(service.calls[0].body), FORM);
		} else {
			assert.match(JSON.parse(text).error, /recaptcha/i);
			assert.equal(service.calls.length, 0);
		}
		assert.ok(!api.logText().includes(SECRET));
	});
}

test("with reCAPTCHA on, a verifier that does not answer in time is a refusal, by the timeout set for it", async (t) => {
	const { service, api } = await withRecaptcha(t, () => new Promise(() => {}), { timeouts: { recaptchaMs: 150 } });
	const started = Date.now();

	const response = await postJson(`${api.url}/api/contact`, { ...FORM, recaptchaToken: "a-token" });
	await response.text();

	assert.equal(response.status, 400);
	assert.equal(service.calls.length, 0);
	// Its own timeout, 150 ms here, and not the contact form's, which is 2 s in these tests.
	assert.ok(Date.now() - started < 1500, "gave up on the verifier's own timeout");
	// TimeoutError, and not the TypeError a timeout read from a misspelt setting gives.
	const line = api.lines.find((entry) => entry.event === "recaptcha_verify_failed");
	assert.equal(line.cause, "TimeoutError");
	assert.ok(!api.logText().includes(SECRET), "the secret is in no log line");
});

test("with reCAPTCHA on, a verifier that cannot be reached is a refusal", async (t) => {
	const service = await startUpstream(t, received);
	const api = await startApi(t, {
		portfolioAi: assistant(service.url),
		contact: { recaptchaSecret: SECRET, recaptchaVerifyUrl: `${await closedUrl()}/siteverify` },
	});

	const response = await postJson(`${api.url}/api/contact`, { ...FORM, recaptchaToken: "a-token" });
	await response.text();

	assert.equal(response.status, 400);
	assert.equal(service.calls.length, 0);
	assert.equal(api.lines.find((entry) => entry.event === "recaptcha_verify_failed").cause, "ECONNREFUSED");
	assert.ok(!api.logText().includes(SECRET), "the secret is in no log line");
});

test("with reCAPTCHA on and nowhere to verify, the form is refused rather than let through", async (t) => {
	const service = await startUpstream(t, received);
	const api = await startApi(t, {
		portfolioAi: assistant(service.url),
		contact: { recaptchaSecret: SECRET, recaptchaVerifyUrl: null },
	});

	const response = await postJson(`${api.url}/api/contact`, { ...FORM, recaptchaToken: "a-token" });
	await response.text();

	assert.equal(response.status, 400);
	assert.equal(service.calls.length, 0);
});
