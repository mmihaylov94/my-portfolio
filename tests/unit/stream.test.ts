import { afterEach, describe, expect, it, vi } from "vitest";
import {
	ChatHttpError,
	ChatStreamError,
	fallbackDetail,
	streamChat,
	type ChatEvent,
} from "../../app/utils/chat/stream";
import { fakeFetch, jsonResponse, liveStream, settle, sse, streamResponse } from "./helpers";

function collect() {
	const events: ChatEvent[] = [];
	return { events, onEvent: (event: ChatEvent) => events.push(event) };
}

afterEach(() => {
	vi.useRealTimers();
});

describe("streamChat", () => {
	it("posts exactly the session id and the question, as JSON, to the site's API", async () => {
		const { fetch, calls } = fakeFetch(() => streamResponse([sse("done", { message_id: 1, citations: [] })]));

		await streamChat({ sessionId: "session-0001", message: "What is Glotsmith?", fetch, onEvent: () => {} });

		expect(calls).toHaveLength(1);
		expect(calls[0]?.url).toBe("/api/chat");
		expect(calls[0]?.init.method).toBe("POST");
		expect(new Headers(calls[0]?.init.headers).get("content-type")).toBe("application/json");
		expect(calls[0]?.body).toEqual({ session_id: "session-0001", message: "What is Glotsmith?" });
	});

	it("hands over each event, and resolves at done with its id and sources", async () => {
		const { fetch } = fakeFetch(() =>
			streamResponse([
				": connected\n\n",
				sse("route", { classification: "mihail_related" }),
				sse("search", {}),
				sse("token", { text: "Glotsmith is " }),
				sse("token", { text: "a SaaS." }),
				sse("done", {
					message_id: 7,
					classification: "mihail_related",
					citations: [{ doc_id: "project-glotsmith", title: "Glotsmith", url: "https://mihaylov.io/case-studies/glotsmith", section: null }],
					usage: { model: "gpt-5-mini", prompt_tokens: 1, completion_tokens: 1, latency_ms: 1, first_token_ms: 1 },
				}),
			]),
		);
		const { events, onEvent } = collect();

		await streamChat({ sessionId: "session-0001", message: "q", fetch, onEvent });

		expect(events).toEqual([
			{ type: "route", classification: "mihail_related" },
			{ type: "search" },
			{ type: "token", text: "Glotsmith is " },
			{ type: "token", text: "a SaaS." },
			{
				type: "done",
				messageId: 7,
				citations: [{ docId: "project-glotsmith", title: "Glotsmith", url: "https://mihaylov.io/case-studies/glotsmith", section: null }],
			},
		]);
	});

	it("hands over the first event while the answer is still arriving", async () => {
		const stream = liveStream();
		const { fetch } = fakeFetch((call) => stream.response(call.init.signal));
		const { events, onEvent } = collect();

		const answering = streamChat({ sessionId: "session-0001", message: "q", fetch, onEvent });
		stream.push(sse("token", { text: "Hello" }));
		await settle();
		expect(events).toEqual([{ type: "token", text: "Hello" }]);

		stream.push(sse("done", { message_id: null, citations: [] }));
		await answering;
		expect(events.at(-1)).toEqual({ type: "done", messageId: null, citations: [] });
	});

	it("ends at an error event, which carries the status and sentence", async () => {
		const { fetch } = fakeFetch(() =>
			streamResponse([sse("token", { text: "Half" }), sse("error", { detail: "The answer was interrupted. Please try again.", status: 502 })]),
		);
		const { events, onEvent } = collect();

		await streamChat({ sessionId: "session-0001", message: "q", fetch, onEvent });

		expect(events.at(-1)).toEqual({ type: "error", status: 502, detail: "The answer was interrupted. Please try again." });
	});

	it("skips events it does not know and data that is not what the contract says", async () => {
		const { fetch } = fakeFetch(() =>
			streamResponse([
				sse("mystery", { anything: true }),
				"event: token\ndata: not json\n\n",
				sse("token", { text: 42 }),
				sse("done", { message_id: "7", citations: [] }),
				sse("token", { text: "kept" }),
				sse("done", { message_id: 8, citations: [{ doc_id: 1 }, { doc_id: "faq", title: "FAQ", url: null, section: "pricing" }] }),
			]),
		);
		const { events, onEvent } = collect();

		await streamChat({ sessionId: "session-0001", message: "q", fetch, onEvent });

		expect(events).toEqual([
			{ type: "token", text: "kept" },
			{ type: "done", messageId: 8, citations: [{ docId: "faq", title: "FAQ", url: null, section: "pricing" }] },
		]);
	});

	it("puts a character split between two chunks back together", async () => {
		const stream = liveStream();
		const { fetch } = fakeFetch((call) => stream.response(call.init.signal));
		const { events, onEvent } = collect();
		const bytes = new TextEncoder().encode(sse("token", { text: "😀" }) + sse("done", { message_id: 1, citations: [] }));
		const middleOfTheEmoji = bytes.indexOf(0xf0) + 2;

		const answering = streamChat({ sessionId: "session-0001", message: "q", fetch, onEvent });
		stream.pushBytes(bytes.slice(0, middleOfTheEmoji));
		stream.pushBytes(bytes.slice(middleOfTheEmoji));
		await answering;

		expect(events[0]).toEqual({ type: "token", text: "😀" });
	});
});

describe("streamChat, when the answer does not begin", () => {
	it("turns a refusal into the API's sentence, with Retry-After in seconds", async () => {
		const { fetch } = fakeFetch(() =>
			jsonResponse(429, { error: "That is a lot of questions in a short time. Please wait a little." }, { "Retry-After": "30" }),
		);

		const error = await streamChat({ sessionId: "session-0001", message: "q", fetch, onEvent: () => {} }).catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ChatHttpError);
		expect(error).toMatchObject({
			status: 429,
			detail: "That is a lot of questions in a short time. Please wait a little.",
			retryAfter: 30,
		});
	});

	it("chooses the sentence by status when the body is not the API's", async () => {
		const page = (status: number) => new Response("<html>Bad gateway</html>", { status, headers: { "Content-Type": "text/html" } });
		for (const [status, detail] of [
			[502, fallbackDetail(502)],
			[524, fallbackDetail(524)],
			[500, fallbackDetail(500)],
		] as const) {
			const { fetch } = fakeFetch(() => page(status));
			const error = await streamChat({ sessionId: "session-0001", message: "q", fetch, onEvent: () => {} }).catch((caught: unknown) => caught);
			expect(error).toBeInstanceOf(ChatHttpError);
			expect((error as ChatHttpError).detail).toBe(detail);
		}
		expect(fallbackDetail(502)).toBe("The assistant is unavailable right now. Please try again in a moment.");
		expect(fallbackDetail(524)).toBe(fallbackDetail(502));
		expect(fallbackDetail(500)).toBe("Something went wrong. Please try again.");
	});

	it("ignores a Retry-After that is a date rather than seconds", async () => {
		const { fetch } = fakeFetch(() => jsonResponse(503, { error: "Busy." }, { "Retry-After": "Wed, 21 Oct 2026 07:28:00 GMT" }));

		const error = await streamChat({ sessionId: "session-0001", message: "q", fetch, onEvent: () => {} }).catch((caught: unknown) => caught);

		expect((error as ChatHttpError).retryAfter).toBeNull();
	});

	it("refuses a success that is not an event stream", async () => {
		const { fetch } = fakeFetch(() => jsonResponse(200, { reply: "not streamed" }));

		const error = await streamChat({ sessionId: "session-0001", message: "q", fetch, onEvent: () => {} }).catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ChatHttpError);
		expect((error as ChatHttpError).status).toBe(502);
	});

	it("calls a failed connection a network failure", async () => {
		const { fetch } = fakeFetch(() => {
			throw new TypeError("Failed to fetch");
		});

		const error = await streamChat({ sessionId: "session-0001", message: "q", fetch, onEvent: () => {} }).catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ChatStreamError);
		expect((error as ChatStreamError).reason).toBe("network");
	});

	it("makes no request for a signal that is already aborted", async () => {
		const { fetch, calls } = fakeFetch(() => streamResponse([]));
		const controller = new AbortController();
		controller.abort();

		const error = await streamChat({ sessionId: "session-0001", message: "q", fetch, signal: controller.signal, onEvent: () => {} }).catch((caught: unknown) => caught);

		expect((error as ChatStreamError).reason).toBe("aborted");
		expect(calls).toHaveLength(0);
	});
});

describe("streamChat, when the answer stops arriving", () => {
	it("calls a stream that closes without done or error an interruption", async () => {
		const { fetch } = fakeFetch(() => streamResponse([sse("token", { text: "Half an" })]));
		const { events, onEvent } = collect();

		const error = await streamChat({ sessionId: "session-0001", message: "q", fetch, onEvent }).catch((caught: unknown) => caught);

		expect((error as ChatStreamError).reason).toBe("ended");
		expect(events).toEqual([{ type: "token", text: "Half an" }]);
	});

	it("calls a connection that breaks a network failure", async () => {
		const stream = liveStream();
		const { fetch } = fakeFetch((call) => stream.response(call.init.signal));

		const answering = streamChat({ sessionId: "session-0001", message: "q", fetch, onEvent: () => {} });
		stream.push(sse("token", { text: "Half" }));
		stream.fail();
		const error = await answering.catch((caught: unknown) => caught);

		expect((error as ChatStreamError).reason).toBe("network");
	});

	it("stops reading when the caller aborts, and aborts the request", async () => {
		const stream = liveStream();
		const { fetch, calls } = fakeFetch((call) => stream.response(call.init.signal));
		const controller = new AbortController();

		const answering = streamChat({ sessionId: "session-0001", message: "q", fetch, signal: controller.signal, onEvent: () => {} });
		stream.push(sse("token", { text: "Half" }));
		await settle();
		controller.abort();
		const error = await answering.catch((caught: unknown) => caught);

		expect((error as ChatStreamError).reason).toBe("aborted");
		expect(calls[0]?.init.signal?.aborted).toBe(true);
	});

	it("gives up after the watchdog's silence, and aborts the request", async () => {
		vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
		const stream = liveStream();
		const { fetch, calls } = fakeFetch((call) => stream.response(call.init.signal));

		const answering = streamChat({ sessionId: "session-0001", message: "q", fetch, watchdogMs: 75_000, onEvent: () => {} }).catch(
			(caught: unknown) => caught,
		);
		stream.push(": connected\n\n");
		await vi.advanceTimersByTimeAsync(74_999);
		expect(calls[0]?.init.signal?.aborted).toBe(false);

		await vi.advanceTimersByTimeAsync(1);
		const error = await answering;

		expect((error as ChatStreamError).reason).toBe("stalled");
		expect(calls[0]?.init.signal?.aborted).toBe(true);
	});

	it("counts the silence from the last chunk, so pings keep a slow answer alive", async () => {
		vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
		const stream = liveStream();
		const { fetch } = fakeFetch((call) => stream.response(call.init.signal));
		const { events, onEvent } = collect();

		const answering = streamChat({ sessionId: "session-0001", message: "q", fetch, watchdogMs: 75_000, onEvent });
		for (let i = 0; i < 4; i++) {
			await vi.advanceTimersByTimeAsync(60_000);
			stream.push(": ping\n\n");
		}
		await vi.advanceTimersByTimeAsync(60_000);
		stream.push(sse("done", { message_id: 3, citations: [] }));
		await answering;

		expect(events).toEqual([{ type: "done", messageId: 3, citations: [] }]);
	});
});
