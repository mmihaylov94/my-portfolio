import { describe, expect, it } from "vitest";
import { watch } from "vue";
import { CONFLICT_DELAYS_MS, createConversation, type ConversationDeps } from "../../app/utils/chat/conversation";
import { STORAGE_KEY } from "../../app/utils/chat/sessionStore";
import type { Answer } from "../../app/utils/chat/types";
import { fakeFetch, jsonResponse, liveStream, memoryStorage, settle, sse, streamResponse, type Call } from "./helpers";

const T = Date.UTC(2026, 8, 25, 12, 0, 0);

const ANSWER = [
	sse("route", { classification: "mihail_related" }),
	sse("search", {}),
	sse("token", { text: "Glotsmith is " }),
	sse("token", { text: "his SaaS." }),
	sse("done", {
		message_id: 7,
		classification: "mihail_related",
		citations: [{ doc_id: "project-glotsmith", title: "Glotsmith", url: "https://mihaylov.io/case-studies/glotsmith", section: null }],
		usage: null,
	}),
];

const CONFLICT = "A reply in this conversation is still being written.";

/** A conversation whose waits are recorded rather than waited, and whose frames run at once. */
function setUp(respond: (call: Call, index: number) => Response | Promise<Response>, deps: Partial<ConversationDeps> = {}) {
	const { fetch, calls } = fakeFetch(respond);
	const waits: number[] = [];
	const storage = memoryStorage();
	const conversation = createConversation({
		storage,
		fetch,
		now: () => T,
		sleep: async (ms) => {
			waits.push(ms);
		},
		...deps,
	});
	const lastAnswer = () => conversation.state.messages.at(-1) as Answer;
	return { conversation, calls, waits, storage, lastAnswer };
}

const chatCalls = (calls: Call[]) => calls.filter((call) => call.url === "/api/chat");

describe("asking", () => {
	it("writes the answer in, with its id and sources, and saves it", async () => {
		const { conversation, calls, storage, lastAnswer } = setUp(() => streamResponse(ANSWER));

		await conversation.send("  What is Glotsmith?  ");

		expect(calls[0]?.body).toEqual({ session_id: conversation.state.sessionId, message: "What is Glotsmith?" });
		expect(conversation.state.messages).toHaveLength(2);
		expect(conversation.state.messages[0]).toMatchObject({ role: "user", text: "What is Glotsmith?" });
		expect(lastAnswer()).toMatchObject({
			status: "done",
			text: "Glotsmith is his SaaS.",
			messageId: 7,
			citations: [{ docId: "project-glotsmith", title: "Glotsmith" }],
			error: null,
		});
		expect(conversation.state.busy).toBe(false);
		expect(JSON.parse(storage.data.get(STORAGE_KEY) ?? "{}").messages).toHaveLength(2);
	});

	it("says it is searching only on the knowledge-base route, until the words arrive", async () => {
		const stream = liveStream();
		const { conversation, lastAnswer } = setUp((call) => stream.response(call.init.signal));

		const asking = conversation.send("What is Glotsmith?");
		await settle();
		expect(lastAnswer().status).toBe("pending");
		expect(conversation.state.busy).toBe(true);

		stream.push(sse("route", { classification: "mihail_related" }));
		await settle();
		expect(lastAnswer().status).toBe("searching");

		stream.push(sse("token", { text: "Glotsmith" }));
		await settle();
		expect(lastAnswer()).toMatchObject({ status: "streaming", text: "Glotsmith" });

		stream.push(sse("done", { message_id: 1, citations: [] }));
		await asking;
		expect(lastAnswer().status).toBe("done");
	});

	it("does not say it is searching for small talk", async () => {
		const stream = liveStream();
		const { conversation, lastAnswer } = setUp((call) => stream.response(call.init.signal));

		const asking = conversation.send("Hello");
		stream.push(sse("route", { classification: "small_talk" }));
		await settle();
		expect(lastAnswer().status).toBe("pending");

		stream.push(sse("token", { text: "Hello!" }) + sse("done", { message_id: 2, citations: [] }));
		await asking;
		expect(lastAnswer()).toMatchObject({ status: "done", text: "Hello!" });
	});

	it("shows words once a frame, and every word before it says done", async () => {
		const stream = liveStream();
		const frames: (() => void)[] = [];
		const { conversation, lastAnswer } = setUp((call) => stream.response(call.init.signal), {
			schedule: (callback) => {
				frames.push(callback);
			},
		});

		const asking = conversation.send("What is Glotsmith?");
		stream.push(sse("token", { text: "Glotsmith " }) + sse("token", { text: "is " }));
		await settle();
		expect(lastAnswer().text).toBe("");
		expect(frames).toHaveLength(1);

		frames.shift()?.();
		expect(lastAnswer().text).toBe("Glotsmith is ");

		// No frame has run for these words, and the answer must already hold them at
		// the moment it becomes done: that is when the page renders it as finished and
		// reads it out.
		let textWhenDone: string | null = null;
		watch(
			() => lastAnswer().status,
			(status) => {
				if (status === "done") textWhenDone = lastAnswer().text;
			},
			{ flush: "sync" },
		);
		stream.push(sse("token", { text: "his SaaS." }) + sse("done", { message_id: 3, citations: [] }));
		await asking;
		expect(textWhenDone).toBe("Glotsmith is his SaaS.");
	});

	it("asks one question at a time", async () => {
		const stream = liveStream();
		const { conversation, calls } = setUp((call) => stream.response(call.init.signal));

		const first = conversation.send("First");
		void conversation.send("Second");
		await settle();
		expect(chatCalls(calls)).toHaveLength(1);
		expect(conversation.state.messages).toHaveLength(2);

		stream.push(sse("done", { message_id: 4, citations: [] }));
		await first;
	});

	it("does not send a question that is empty or too long, counted in characters", async () => {
		const { conversation, calls } = setUp(() => streamResponse(ANSWER));

		await conversation.send("   ");
		await conversation.send("x".repeat(2001));
		expect(calls).toHaveLength(0);

		// 2,000 emoji are 4,000 UTF-16 code units, and still 2,000 characters.
		await conversation.send("😀".repeat(2000));
		expect(calls).toHaveLength(1);
	});

	it("keeps the last 50 messages", async () => {
		const { conversation } = setUp(() => streamResponse(ANSWER));

		for (let i = 0; i < 26; i++) await conversation.send(`Question ${i}`);

		expect(conversation.state.messages).toHaveLength(50);
		expect(conversation.state.messages[0]).toMatchObject({ role: "user", text: "Question 1" });
	});
});

describe("when the assistant says not now", () => {
	it("asks again after 3, 5 and 8 seconds while the last answer is still being written, then says so", async () => {
		const { conversation, calls, waits, lastAnswer } = setUp(() => jsonResponse(409, { error: CONFLICT }));

		await conversation.send("What is Glotsmith?");

		expect(waits).toEqual([...CONFLICT_DELAYS_MS]);
		expect(waits).toEqual([3000, 5000, 8000]);
		expect(chatCalls(calls)).toHaveLength(4);
		expect(lastAnswer()).toMatchObject({ status: "error", error: CONFLICT });
	});

	it("carries on once the last answer is finished", async () => {
		const { conversation, waits, lastAnswer } = setUp((_, index) =>
			index < 2 ? jsonResponse(409, { error: CONFLICT }) : streamResponse(ANSWER),
		);

		await conversation.send("What is Glotsmith?");

		expect(waits).toEqual([3000, 5000]);
		expect(lastAnswer().status).toBe("done");
	});

	it("waits out one short 503, and only one", async () => {
		const busy = "The assistant is busy. Please try again in a moment.";
		// A third try would succeed, so asking a third time shows as a finished answer.
		const { conversation, calls, waits, lastAnswer } = setUp((_, index) =>
			index < 2 ? jsonResponse(503, { error: busy }, { "Retry-After": "5" }) : streamResponse(ANSWER),
		);

		await conversation.send("What is Glotsmith?");

		expect(waits).toEqual([5000]);
		expect(chatCalls(calls)).toHaveLength(2);
		expect(lastAnswer()).toMatchObject({ status: "error", error: busy });
	});

	it("does not wait out a long 503, a 429 or a 400", async () => {
		for (const [status, headers] of [
			[503, { "Retry-After": "60" }],
			[503, {}],
			[429, { "Retry-After": "5" }],
			[400, {}],
		] as const) {
			const { conversation, calls, waits, lastAnswer } = setUp(() => jsonResponse(status, { error: `Refused with ${status}.` }, headers));

			await conversation.send("What is Glotsmith?");

			expect(waits, `${status}`).toEqual([]);
			expect(chatCalls(calls)).toHaveLength(1);
			expect(lastAnswer()).toMatchObject({ status: "error", error: `Refused with ${status}.` });
		}
	});
});

describe("when the answer stops arriving", () => {
	it("keeps what arrived, and says it was interrupted", async () => {
		const { conversation, lastAnswer } = setUp(() => streamResponse([sse("token", { text: "Glotsmith is" })]));

		await conversation.send("What is Glotsmith?");

		expect(lastAnswer()).toMatchObject({
			status: "error",
			text: "Glotsmith is",
			error: "The answer was interrupted. Please try again.",
		});
	});

	it("says the answer was interrupted when the connection breaks after some words", async () => {
		const stream = liveStream();
		const { conversation, lastAnswer } = setUp((call) => stream.response(call.init.signal));

		const asking = conversation.send("What is Glotsmith?");
		stream.push(sse("token", { text: "Glotsmith is" }));
		await settle();
		stream.fail();
		await asking;

		expect(lastAnswer()).toMatchObject({
			status: "error",
			text: "Glotsmith is",
			error: "The answer was interrupted. Please try again.",
		});
	});

	it("says the assistant took too long when nothing arrives for the watchdog's whole wait", async () => {
		const stream = liveStream();
		const { conversation, lastAnswer } = setUp((call) => stream.response(call.init.signal), { watchdogMs: 20 });

		await conversation.send("What is Glotsmith?");

		expect(lastAnswer()).toMatchObject({
			status: "error",
			error: "The assistant took too long to respond. Please try again.",
		});
	});

	it("says the assistant could not be reached when nothing arrived", async () => {
		const { conversation, lastAnswer } = setUp(() => {
			throw new TypeError("Failed to fetch");
		});

		await conversation.send("What is Glotsmith?");

		expect(lastAnswer()).toMatchObject({
			status: "error",
			text: "",
			error: "The assistant could not be reached. Please check your connection and try again.",
		});
	});

	it("shows the sentence of an error event", async () => {
		const { conversation, lastAnswer } = setUp(() =>
			streamResponse([sse("error", { detail: "The assistant is unavailable right now. Please try again in a moment.", status: 503 })]),
		);

		await conversation.send("What is Glotsmith?");

		expect(lastAnswer()).toMatchObject({ status: "error", error: "The assistant is unavailable right now. Please try again in a moment." });
	});

	it("asks the same question again, in the same place, on Try again", async () => {
		const { conversation, calls, lastAnswer } = setUp((_, index) =>
			index === 0 ? streamResponse([sse("token", { text: "Half" })]) : streamResponse(ANSWER),
		);

		await conversation.send("What is Glotsmith?");
		await conversation.retry();

		expect(chatCalls(calls).map((call) => call.body)).toEqual([
			{ session_id: conversation.state.sessionId, message: "What is Glotsmith?" },
			{ session_id: conversation.state.sessionId, message: "What is Glotsmith?" },
		]);
		expect(conversation.state.messages).toHaveLength(2);
		expect(lastAnswer()).toMatchObject({ status: "done", text: "Glotsmith is his SaaS.", error: null });
	});

	it("does not ask again after an answer that succeeded", async () => {
		const { conversation, calls } = setUp(() => streamResponse(ANSWER));

		await conversation.send("What is Glotsmith?");
		await conversation.retry();

		expect(chatCalls(calls)).toHaveLength(1);
	});
});

describe("New conversation", () => {
	it("stops reading, and the old answer never reaches the new conversation", async () => {
		const stream = liveStream();
		const { conversation, calls, storage } = setUp((call) => stream.response(call.init.signal));

		const asking = conversation.send("What is Glotsmith?");
		stream.push(sse("token", { text: "Glotsmith" }));
		await settle();
		const oldSession = conversation.state.sessionId;

		conversation.reset();
		expect(calls[0]?.init.signal?.aborted).toBe(true);
		stream.push(sse("token", { text: " is late." }) + sse("done", { message_id: 5, citations: [] }));
		await asking;
		await settle();

		expect(conversation.state.sessionId).not.toBe(oldSession);
		expect(conversation.state.messages).toEqual([]);
		expect(conversation.state.busy).toBe(false);
		expect(storage.data.has(STORAGE_KEY)).toBe(false);
	});

	it("never lets words that arrive after it into the new conversation", async () => {
		// A stream that goes on delivering after its request is aborted, so only the
		// conversation's own guard stands between its words and the new conversation.
		const stubborn = liveStream();
		const { conversation, lastAnswer } = setUp((_, index) =>
			index === 0 ? stubborn.response() : streamResponse([sse("token", { text: "Fresh answer." }), sse("done", { message_id: 9, citations: [] })]),
		);

		const asking = conversation.send("What is Glotsmith?");
		stubborn.push(sse("token", { text: "Glotsmith" }));
		await settle();
		conversation.reset();
		stubborn.push(sse("token", { text: " STALE" }) + sse("done", { message_id: 5, citations: [] }));
		await asking;
		await settle();
		expect(conversation.state.messages).toEqual([]);

		await conversation.send("Hello again");
		expect(lastAnswer()).toMatchObject({ status: "done", text: "Fresh answer.", messageId: 9 });
	});

	it("lets an old answer that ends late leave the new one alone", async () => {
		// The old stream ignores its abort and ends while the new answer is arriving.
		// Its clean-up must not mark the conversation idle, or drop the new answer's words.
		const old = liveStream();
		const fresh = liveStream();
		const { conversation, lastAnswer } = setUp((call, index) =>
			index === 0 ? old.response() : fresh.response(call.init.signal),
		);

		const first = conversation.send("First");
		old.push(sse("token", { text: "Old" }));
		await settle();
		conversation.reset();
		const second = conversation.send("Second");
		await settle();

		old.push(sse("done", { message_id: 1, citations: [] }));
		await first;
		expect(conversation.state.busy).toBe(true);

		fresh.push(sse("token", { text: "New" }) + sse("done", { message_id: 2, citations: [] }));
		await second;
		expect(lastAnswer()).toMatchObject({ status: "done", text: "New", messageId: 2 });
	});

	it("stops waiting to ask again", async () => {
		let release!: () => void;
		const { conversation, calls } = setUp(() => jsonResponse(409, { error: CONFLICT }), {
			sleep: (_, signal) =>
				new Promise<void>((resolve) => {
					release = resolve;
					signal.addEventListener("abort", () => resolve());
				}),
		});

		const asking = conversation.send("What is Glotsmith?");
		await settle();
		conversation.reset();
		await asking;
		release();
		await settle();

		expect(chatCalls(calls)).toHaveLength(1);
		expect(conversation.state.messages).toEqual([]);
	});
});

describe("rating an answer", () => {
	it("posts the rating, and a comment with a thumbs down", async () => {
		const { conversation, calls, lastAnswer } = setUp((call) =>
			call.url === "/api/chat" ? streamResponse(ANSWER) : new Response(null, { status: 204 }),
		);
		await conversation.send("What is Glotsmith?");

		expect(await conversation.rate(lastAnswer(), 1)).toBe(true);
		expect(await conversation.rate(lastAnswer(), -1, "  Not what I asked.  ")).toBe(true);

		const feedback = calls.filter((call) => call.url === "/api/chat/feedback").map((call) => call.body);
		expect(feedback).toEqual([
			{ session_id: conversation.state.sessionId, message_id: 7, rating: 1 },
			{ session_id: conversation.state.sessionId, message_id: 7, rating: -1, comment: "Not what I asked." },
		]);
		expect(lastAnswer()).toMatchObject({ rating: -1, commented: true });
	});

	it("puts the rating back when it could not be sent", async () => {
		const { conversation, lastAnswer } = setUp((call) =>
			call.url === "/api/chat" ? streamResponse(ANSWER) : jsonResponse(429, { error: "Too many requests." }),
		);
		await conversation.send("What is Glotsmith?");

		expect(await conversation.rate(lastAnswer(), -1, "Wrong.")).toBe(false);
		expect(lastAnswer()).toMatchObject({ rating: null, commented: false });
	});

	it("has nothing to rate on an answer that was not stored", async () => {
		const { conversation, calls, lastAnswer } = setUp(() =>
			streamResponse([sse("token", { text: "The assistant has reached its limit for today." }), sse("done", { message_id: null, citations: [] })]),
		);
		await conversation.send("What is Glotsmith?");

		expect(await conversation.rate(lastAnswer(), 1)).toBe(false);
		expect(calls.filter((call) => call.url === "/api/chat/feedback")).toHaveLength(0);
	});
});

describe("across reloads", () => {
	it("picks up the saved conversation, in the same session", async () => {
		const { conversation, storage } = setUp(() => streamResponse(ANSWER));
		await conversation.send("What is Glotsmith?");

		const reloaded = createConversation({ storage, now: () => T + 60_000 });

		expect(reloaded.state.sessionId).toBe(conversation.state.sessionId);
		expect(reloaded.state.messages).toEqual(conversation.state.messages);
	});

	it("brings back an answer that was arriving when the page went away as interrupted", async () => {
		const stream = liveStream();
		const { conversation, storage } = setUp((call) => stream.response(call.init.signal), {
			schedule: () => {},
		});

		void conversation.send("What is Glotsmith?");
		stream.push(sse("token", { text: "Glotsmith is" }));
		await settle();
		// What the page does on pagehide: save, words not yet shown included.
		conversation.persist();

		const reloaded = createConversation({ storage, now: () => T + 1000 });
		expect(reloaded.state.messages.at(-1)).toMatchObject({ status: "interrupted", text: "Glotsmith is" });
		stream.end();
	});
});
