import http from "node:http";
import { once } from "node:events";
import { createApp } from "../src/app.js";
import { DEFAULT_LIMITS, DEFAULT_TIMEOUTS } from "../src/config.js";

// Shared by the test files. Not matched by node --test's default patterns, so it is
// never run as a test itself.

export const API_KEY = "test-key-0123456789abcdef0123456789abcdef";
export const SESSION = "session-0001";

export function deferred() {
	let resolve;
	let reject;
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

export function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function listen(t, server) {
	server.listen(0, "127.0.0.1");
	await once(server, "listening");
	t.after(() => {
		server.closeAllConnections();
		server.close();
	});
	return `http://127.0.0.1:${server.address().port}`;
}

/** A stand-in for the assistant, recording every request it receives. */
export async function startUpstream(t, handler) {
	const calls = [];
	const server = http.createServer(async (req, res) => {
		const chunks = [];
		for await (const chunk of req) chunks.push(chunk);
		const call = { method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString("utf8") };
		calls.push(call);
		await handler(req, res, call);
	});
	return { url: await listen(t, server), calls };
}

/** A port nothing listens on. */
export async function closedUrl() {
	const server = http.createServer();
	server.listen(0, "127.0.0.1");
	await once(server, "listening");
	const { port } = server.address();
	server.close();
	await once(server, "close");
	return `http://127.0.0.1:${port}`;
}

export function assistant(url) {
	return { baseUrl: url, apiKey: API_KEY };
}

/** The API with test settings, logging into an array instead of stdout. */
export async function startApi(t, overrides = {}) {
	const lines = [];
	const log = {};
	for (const level of ["info", "warn", "error"]) {
		log[level] = (event, fields = {}) => lines.push({ level, event, ...fields });
	}
	const config = {
		port: 0,
		trustProxy: false,
		portfolioAi: null,
		contact: { webhookUrl: null, apiKey: null, webhookPath: "/contact", recaptchaSecret: null },
		problems: [],
		...overrides,
		limits: { ...DEFAULT_LIMITS, ...overrides.limits },
		timeouts: { ...DEFAULT_TIMEOUTS, feedbackMs: 2000, contactMs: 2000, ...overrides.timeouts },
	};
	const app = createApp(config, { log });
	const url = await listen(t, http.createServer(app));
	return { url, app, lines, logText: () => JSON.stringify(lines) };
}

export function upstreamEventStream(res, requestId = "req-test") {
	res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "x-request-id": requestId });
}

export function sse(event, data) {
	return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export const DONE = { message_id: 7, classification: "mihail_related", citations: [], usage: null };

export function postJson(url, body, { headers = {}, ...init } = {}) {
	return fetch(url, {
		method: "POST",
		...init,
		headers: { "Content-Type": "application/json", ...headers },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});
}

/**
 * A request with exactly these headers. fetch adds and removes some of its own, so the
 * tests that check what is forwarded use node:http instead.
 */
export function rawPost(url, body, headers = {}) {
	return new Promise((resolve, reject) => {
		const req = http.request(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers } }, (res) => {
			const chunks = [];
			res.on("data", (chunk) => chunks.push(chunk));
			res.on("end", () => {
				resolve({ status: res.statusCode, headers: res.headers, text: Buffer.concat(chunks).toString("utf8") });
			});
		});
		req.on("error", reject);
		req.end(typeof body === "string" ? body : JSON.stringify(body));
	});
}

function parseEvent(block) {
	let event = "message";
	const data = [];
	for (const line of block.split("\n")) {
		if (line === "" || line.startsWith(":")) continue;
		const colon = line.indexOf(":");
		const field = colon === -1 ? line : line.slice(0, colon);
		let value = colon === -1 ? "" : line.slice(colon + 1);
		if (value.startsWith(" ")) value = value.slice(1);
		if (field === "event") event = value;
		else if (field === "data") data.push(value);
	}
	return data.length === 0 ? null : { event, data: JSON.parse(data.join("\n")) };
}

/** The server-sent events in a response, comments skipped, as they arrive. */
export async function* sseEvents(response) {
	const decoder = new TextDecoder();
	let buffer = "";
	for await (const chunk of response.body) {
		buffer += decoder.decode(chunk, { stream: true });
		let end = buffer.indexOf("\n\n");
		while (end !== -1) {
			const event = parseEvent(buffer.slice(0, end));
			buffer = buffer.slice(end + 2);
			if (event) yield event;
			end = buffer.indexOf("\n\n");
		}
	}
}

export async function collectEvents(response) {
	const events = [];
	for await (const event of sseEvents(response)) events.push(event);
	return events;
}

export async function waitFor(predicate, timeout = 2000) {
	const deadline = Date.now() + timeout;
	for (;;) {
		const value = predicate();
		if (value) return value;
		if (Date.now() > deadline) throw new Error("waitFor: condition never became true");
		await sleep(10);
	}
}
