import assert from "node:assert/strict";
import { once } from "node:events";
import net from "node:net";
import { test } from "node:test";
import { beginShutdown } from "../src/app.js";
import {
	API_KEY,
	DONE,
	SESSION,
	assistant,
	collectEvents,
	deferred,
	postJson,
	rawPost,
	sleep,
	sse,
	sseEvents,
	startApi,
	startUpstream,
	upstreamEventStream,
	waitFor,
} from "./helpers.js";

const CRLF = String.fromCharCode(13, 10);

const ROUTE = { classification: "mihail_related" };

test("events reach the visitor while the answer is still being written", { timeout: 5000 }, async (t) => {
	// The test that matters most: a proxy that buffers never delivers the first event
	// until the upstream has finished, so this read would wait and time out.
	const release = deferred();
	let upstreamEnded = false;
	const upstream = await startUpstream(t, async (_req, res) => {
		upstreamEventStream(res);
		res.write(sse("route", ROUTE));
		await release.promise;
		res.end(sse("token", { text: "Hi " }) + sse("done", DONE));
		upstreamEnded = true;
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url) });

	const response = await postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" });
	assert.equal(response.status, 200);
	const events = sseEvents(response);

	const first = await events.next();
	assert.equal(first.value.event, "route");
	assert.equal(upstreamEnded, false, "the first event arrived only after the upstream finished");

	release.resolve();
	const rest = [];
	for await (const event of events) rest.push(event.event);
	assert.deepEqual(rest, ["token", "done"]);
	await waitFor(() => api.lines.find((line) => line.event === "chat_stream" && line.outcome === "completed"));
});

test("the stream is sent uncompressed and uncached, and says nothing about the server", async (t) => {
	const upstream = await startUpstream(t, (_req, res) => {
		upstreamEventStream(res, "req-headers");
		res.end(sse("done", DONE));
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url) });

	const response = await rawPost(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" }, {
		"Accept-Encoding": "gzip, br",
	});

	assert.equal(response.status, 200);
	assert.match(response.headers["content-type"], /^text\/event-stream/);
	assert.match(response.headers["cache-control"], /no-cache/);
	assert.match(response.headers["cache-control"], /no-transform/);
	assert.equal(response.headers["x-accel-buffering"], "no");
	for (const name of ["content-length", "content-encoding", "x-powered-by", "x-request-id"]) {
		assert.equal(response.headers[name], undefined, name);
	}
	assert.ok(response.text.startsWith(": connected\n\n"));
});

test("the assistant receives the key, the checked body, and only what it asks for", async (t) => {
	const upstream = await startUpstream(t, (_req, res) => {
		upstreamEventStream(res);
		res.end(sse("done", DONE));
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url), trustProxy: 1 });

	await rawPost(`${api.url}/api/chat`, { session_id: SESSION, message: "  Hello there \n" }, {
		Cookie: "theme=dark",
		"X-Forwarded-For": "198.51.100.1, 203.0.113.9",
		"User-Agent": "TestAgent/1.0",
		Referer: "https://mihaylov.io/case-studies/glotsmith?utm_source=x#top",
	});

	const [call] = upstream.calls;
	assert.equal(call.method, "POST");
	assert.equal(call.url, "/v1/chat/stream");
	assert.equal(call.headers.authorization, `Bearer ${API_KEY}`);
	assert.equal(call.headers.accept, "text/event-stream");
	assert.match(call.headers["content-type"], /^application\/json/);
	assert.deepEqual(JSON.parse(call.body), { session_id: SESSION, message: "Hello there" });
	// One hop trusted: the address Traefik saw, not the one the visitor wrote first.
	assert.equal(call.headers["x-visitor-ip"], "203.0.113.9");
	assert.equal(call.headers["x-visitor-user-agent"], "TestAgent/1.0");
	assert.equal(call.headers["x-visitor-referrer"], "https://mihaylov.io/case-studies/glotsmith");
	assert.equal(call.headers.cookie, undefined);
	assert.equal(call.headers["x-forwarded-for"], undefined);
});

test("with two hops trusted, the visitor is the address Cloudflare saw, whatever they sent", async (t) => {
	const upstream = await startUpstream(t, (_req, res) => {
		upstreamEventStream(res);
		res.end(sse("done", DONE));
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url), trustProxy: 2 });

	// As production builds it: the visitor's own (spoofed) entry, the address
	// Cloudflare saw, then the Cloudflare edge that Traefik saw.
	await rawPost(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" }, {
		"X-Forwarded-For": "192.0.2.66, 203.0.113.9, 198.51.100.7",
	});

	assert.equal(upstream.calls[0].headers["x-visitor-ip"], "203.0.113.9");
});

test("with nothing trusted, no address is forwarded at all", async (t) => {
	const upstream = await startUpstream(t, (_req, res) => {
		upstreamEventStream(res);
		res.end(sse("done", DONE));
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url), trustProxy: false });

	await rawPost(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" }, {
		"X-Forwarded-For": "203.0.113.9",
	});

	assert.equal(upstream.calls[0].headers["x-visitor-ip"], undefined);
});

test("a visitor who leaves mid-answer stops the reading upstream, and nothing else", { timeout: 5000 }, async (t) => {
	const upstreamGone = deferred();
	const upstream = await startUpstream(t, (_req, res) => {
		res.on("close", () => {
			if (!res.writableFinished) upstreamGone.resolve();
		});
		upstreamEventStream(res);
		res.write(sse("route", ROUTE));
		// ...and never finishes.
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url) });

	const controller = new AbortController();
	const response = await postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" }, {
		signal: controller.signal,
	});
	const events = sseEvents(response);
	await events.next();
	controller.abort();
	events.return().catch(() => {});

	await upstreamGone.promise;
	await waitFor(() => api.lines.find((line) => line.event === "chat_stream" && line.outcome === "client_gone"));
	const health = await fetch(`${api.url}/api/health`);
	assert.equal(health.status, 200);
});

test("a visitor who leaves before the answer starts also lets go of the assistant", { timeout: 5000 }, async (t) => {
	const reached = deferred();
	const upstreamGone = deferred();
	const upstream = await startUpstream(t, (_req, res) => {
		res.on("close", () => {
			if (!res.writableFinished) upstreamGone.resolve();
		});
		reached.resolve();
		// No status line yet: the assistant is still admitting the question.
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url) });

	const controller = new AbortController();
	const pending = postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" }, {
		signal: controller.signal,
	}).catch(() => null);
	await reached.promise;
	controller.abort();
	await pending;

	await upstreamGone.promise;
	await waitFor(() => api.lines.find((line) => line.event === "chat_stream" && line.outcome === "client_gone"));
});

test("an assistant that goes quiet ends the stream with an error event", { timeout: 5000 }, async (t) => {
	const upstreamGone = deferred();
	const upstream = await startUpstream(t, (_req, res) => {
		res.on("close", () => {
			if (!res.writableFinished) upstreamGone.resolve();
		});
		upstreamEventStream(res);
		res.write(sse("route", ROUTE));
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url), timeouts: { chatIdleMs: 200 } });

	const events = await collectEvents(await postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" }));

	assert.deepEqual(events.map((event) => event.event), ["route", "error"]);
	assert.equal(events[1].data.status, 504);
	assert.equal(typeof events[1].data.detail, "string");
	await upstreamGone.promise;
	await waitFor(() => api.lines.find((line) => line.outcome === "idle_timeout"));
});

test("pings keep a slow answer alive", { timeout: 5000 }, async (t) => {
	const upstream = await startUpstream(t, (_req, res) => {
		upstreamEventStream(res);
		const ping = setInterval(() => res.write(": ping\n\n"), 50);
		setTimeout(() => {
			clearInterval(ping);
			res.end(sse("done", DONE));
		}, 500);
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url), timeouts: { chatIdleMs: 200 } });

	const events = await collectEvents(await postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" }));

	assert.deepEqual(events.map((event) => event.event), ["done"]);
});

test("an answer that never ends is cut off by the overall limit, pings or not", { timeout: 5000 }, async (t) => {
	const upstream = await startUpstream(t, (_req, res) => {
		upstreamEventStream(res);
		const ping = setInterval(() => res.write(": ping\n\n"), 50);
		res.on("close", () => clearInterval(ping));
	});
	const api = await startApi(t, {
		portfolioAi: assistant(upstream.url),
		timeouts: { chatIdleMs: 200, chatOverallMs: 400 },
	});

	const events = await collectEvents(await postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" }));

	assert.deepEqual(events.map((event) => event.event), ["error"]);
	assert.equal(events[0].data.status, 504);
	await waitFor(() => api.lines.find((line) => line.outcome === "overall_timeout"));
});

test("a connection to the assistant that breaks mid-answer is reported, not just dropped", { timeout: 5000 }, async (t) => {
	const upstream = await startUpstream(t, (_req, res) => {
		upstreamEventStream(res);
		res.write(sse("route", ROUTE));
		setTimeout(() => res.destroy(), 50);
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url) });

	const events = await collectEvents(await postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" }));

	assert.deepEqual(events.map((event) => event.event), ["route", "error"]);
	assert.equal(events[1].data.status, 502);
	await waitFor(() => api.lines.find((line) => line.outcome === "upstream_broke"));
});

test("an event cut off by a broken connection never reaches the visitor half-written", { timeout: 5000 }, async (t) => {
	const upstream = await startUpstream(t, (_req, res) => {
		upstreamEventStream(res);
		res.write(`${sse("route", ROUTE)}event: token\ndata: {"text":"Hel`);
		setTimeout(() => res.destroy(), 50);
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url) });

	// collectEvents parses every event's data as JSON, so a truncated one would throw.
	const events = await collectEvents(await postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" }));

	assert.deepEqual(events.map((event) => event.event), ["route", "error"]);
	assert.equal(events[1].data.status, 502);
});

test("a stopping server ends an open stream with the restarting event", { timeout: 5000 }, async (t) => {
	const upstream = await startUpstream(t, (_req, res) => {
		upstreamEventStream(res);
		res.write(sse("route", ROUTE));
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url) });

	const response = await postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" });
	const events = sseEvents(response);
	await events.next();
	beginShutdown(api.app);
	const rest = [];
	for await (const event of events) rest.push(event);

	assert.deepEqual(rest.map((event) => event.event), ["error"]);
	assert.equal(rest[0].data.status, 503);
});

test("a stopping server takes no new questions, and lets go of the connection", async (t) => {
	const upstream = await startUpstream(t, (_req, res) => {
		upstreamEventStream(res);
		res.end(sse("done", DONE));
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url) });
	beginShutdown(api.app);

	const response = await rawPost(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" });

	assert.equal(response.status, 503);
	assert.equal(response.headers["retry-after"], "5");
	assert.equal(response.headers.connection, "close");
	assert.equal(upstream.calls.length, 0);
});

test("a question still arriving when the shutdown begins is refused, not started", { timeout: 5000 }, async (t) => {
	const upstream = await startUpstream(t, (_req, res) => {
		upstreamEventStream(res);
		res.end(sse("done", DONE));
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url) });
	const body = JSON.stringify({ session_id: SESSION, message: "Hello" });
	const head = [
		"POST /api/chat HTTP/1.1",
		"Host: localhost",
		"Content-Type: application/json",
		`Content-Length: ${Buffer.byteLength(body)}`,
		"",
		"",
	].join(CRLF);

	const socket = net.connect(Number(new URL(api.url).port), "127.0.0.1");
	t.after(() => socket.destroy());
	await once(socket, "connect");
	let received = "";
	socket.on("data", (chunk) => {
		received += chunk.toString("utf8");
	});
	// Past the limiter and the closing check, and waiting for the rest of its body...
	socket.write(head + body.slice(0, 10));
	await sleep(100);
	// ...when the shutdown begins.
	beginShutdown(api.app);
	socket.write(body.slice(10));

	await waitFor(() => received.includes(CRLF + CRLF));
	assert.match(received, /^HTTP\/1\.1 503/);
	assert.equal(upstream.calls.length, 0);
});

test("the assistant's own error event passes through unchanged", async (t) => {
	const failure = { detail: "The assistant is unavailable right now. Please try again in a moment.", status: 503 };
	const upstream = await startUpstream(t, (_req, res) => {
		upstreamEventStream(res);
		res.end(sse("route", ROUTE) + sse("error", failure));
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url) });

	const events = await collectEvents(await postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" }));

	assert.deepEqual(events.map((event) => event.event), ["route", "error"]);
	assert.deepEqual(events[1].data, failure);
});

test("a character split across two chunks arrives whole", { timeout: 5000 }, async (t) => {
	const bytes = Buffer.from(sse("token", { text: "Café" }) + sse("done", DONE));
	const split = bytes.indexOf(0xc3) + 1; // after the first byte of "é"
	const upstream = await startUpstream(t, (_req, res) => {
		upstreamEventStream(res);
		res.write(bytes.subarray(0, split));
		setTimeout(() => res.end(bytes.subarray(split)), 50);
	});
	const api = await startApi(t, { portfolioAi: assistant(upstream.url) });

	const events = await collectEvents(await postJson(`${api.url}/api/chat`, { session_id: SESSION, message: "Hello" }));

	assert.equal(events[0].data.text, "Café");
});
