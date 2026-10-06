import { describe, expect, it } from "vitest";
import {
	MAX_MESSAGES,
	RESUME_WITHIN_MS,
	STORAGE_KEY,
	loadConversation,
	newSessionId,
	saveConversation,
	type StoredConversation,
} from "../../app/utils/chat/sessionStore";
import type { Answer, ChatMessage, Question } from "../../app/utils/chat/types";
import { brokenStorage, memoryStorage } from "./helpers";

const T = Date.UTC(2026, 8, 25, 12, 0, 0);

function question(at: number, id = "q1"): Question {
	return { id, role: "user", text: "What is Glotsmith?", at };
}

function answer(at: number, changes: Partial<Answer> = {}): Answer {
	return {
		id: "a1",
		role: "assistant",
		question: "What is Glotsmith?",
		text: "Glotsmith is a language-learning SaaS.",
		status: "done",
		messageId: 12,
		citations: [{ docId: "project-glotsmith", title: "Glotsmith", url: "https://mihaylov.io/case-studies/glotsmith", section: null }],
		error: null,
		rating: 1,
		commented: false,
		at,
		...changes,
	};
}

function stored(messages: ChatMessage[], sessionId = "3f0c9a52-8d1e-4b7a-9c2f-6e5d4c3b2a10"): StoredConversation {
	return { sessionId, messages };
}

/** Save `record` as raw JSON, bypassing saveConversation's own shaping. */
function withRaw(record: unknown) {
	const storage = memoryStorage();
	storage.setItem(STORAGE_KEY, JSON.stringify(record));
	return storage;
}

describe("saving and loading", () => {
	it("gives back what was saved", () => {
		const storage = memoryStorage();
		const conversation = stored([question(T), answer(T)]);

		saveConversation(storage, conversation);

		expect(loadConversation(storage, T + 1000)).toEqual(conversation);
	});

	it("resumes up to 24 hours after the last message, and not a moment later", () => {
		const storage = memoryStorage();
		saveConversation(storage, stored([question(T - 3_600_000, "old"), question(T)]));

		expect(loadConversation(storage, T + RESUME_WITHIN_MS)).not.toBeNull();
		expect(loadConversation(storage, T + RESUME_WITHIN_MS + 1)).toBeNull();
		// A conversation too old to resume is also removed from the browser.
		expect(storage.data.has(STORAGE_KEY)).toBe(false);
	});

	it("tolerates a clock moved back a few minutes, and not a conversation from the future", () => {
		const storage = memoryStorage();
		saveConversation(storage, stored([question(T)]));
		expect(loadConversation(storage, T - 4 * 60_000)).not.toBeNull();
		expect(loadConversation(storage, T - 6 * 60_000)).toBeNull();
	});

	it("brings an answer that was still arriving back as interrupted, with what had arrived", () => {
		const storage = memoryStorage();
		for (const status of ["pending", "searching", "streaming"] as const) {
			saveConversation(storage, stored([question(T), answer(T, { status, text: "Glotsmith is", messageId: null, rating: null })]));
			const loaded = loadConversation(storage, T);
			expect(loaded?.messages[1]).toMatchObject({ status: "interrupted", text: "Glotsmith is" });
		}
	});

	it("keeps the last 50 messages, saving and loading", () => {
		const storage = memoryStorage();
		const many = Array.from({ length: 60 }, (_, index) => question(T + index, `q${index}`));

		saveConversation(storage, stored(many));
		const saved = JSON.parse(storage.data.get(STORAGE_KEY) ?? "{}") as StoredConversation;
		expect(saved.messages).toHaveLength(MAX_MESSAGES);
		expect(saved.messages[0]?.id).toBe("q10");

		const raw = withRaw(stored(many));
		const loaded = loadConversation(raw, T + 60);
		expect(loaded?.messages).toHaveLength(MAX_MESSAGES);
		expect(loaded?.messages.at(-1)?.id).toBe("q59");
	});

	it("removes the record when the conversation is empty", () => {
		const storage = memoryStorage();
		saveConversation(storage, stored([question(T)]));
		saveConversation(storage, stored([]));
		expect(storage.data.has(STORAGE_KEY)).toBe(false);
	});
});

describe("a record that cannot be trusted is discarded whole", () => {
	const good = { sessionId: "3f0c9a52-8d1e-4b7a-9c2f-6e5d4c3b2a10", messages: [question(T), answer(T)] };

	it("keeps a good record, as a check on the cases below", () => {
		expect(loadConversation(withRaw(good), T)).not.toBeNull();
	});

	const broken: Record<string, unknown> = {
		"not JSON": "{\"sessionId\":",
		"not an object": [good],
		"a session id too short": { ...good, sessionId: "abc" },
		"a session id with other characters": { ...good, sessionId: "3f0c9a52 8d1e" },
		"no messages": { ...good, messages: [] },
		"a role it does not know": { ...good, messages: [{ ...question(T), role: "system" }] },
		"a question with no text": { ...good, messages: [{ id: "q1", role: "user", at: T }] },
		"a time that is not a number": { ...good, messages: [{ ...question(T), at: "yesterday" }] },
		"a status it does not know": { ...good, messages: [answer(T, { status: "thinking" as never })] },
		"a message id as a string": { ...good, messages: [{ ...answer(T), messageId: "12" }] },
		"a message id that is not positive": { ...good, messages: [{ ...answer(T), messageId: 0 }] },
		"a rating of 2": { ...good, messages: [{ ...answer(T), rating: 2 }] },
		"a rating of true": { ...good, messages: [{ ...answer(T), rating: true }] },
		"an answer missing a field": { ...good, messages: [(({ commented: _, ...rest }) => rest)(answer(T))] },
		"a citation with a numeric url": { ...good, messages: [answer(T, { citations: [{ docId: "faq", title: "FAQ", url: 5 as never, section: null }] })] },
	};

	for (const [name, record] of Object.entries(broken)) {
		it(`discards ${name}`, () => {
			const storage = memoryStorage();
			storage.setItem(STORAGE_KEY, typeof record === "string" ? record : JSON.stringify(record));

			expect(loadConversation(storage, T)).toBeNull();
			expect(storage.data.has(STORAGE_KEY)).toBe(false);
		});
	}
});

describe("storage that refuses", () => {
	it("loads nothing and saves nothing, without throwing", () => {
		expect(loadConversation(brokenStorage(), T)).toBeNull();
		expect(() => saveConversation(brokenStorage(), stored([question(T)]))).not.toThrow();
		expect(() => saveConversation(brokenStorage(), stored([]))).not.toThrow();
	});

	it("is the same as no storage at all", () => {
		expect(loadConversation(null, T)).toBeNull();
		expect(() => saveConversation(null, stored([question(T)]))).not.toThrow();
	});
});

describe("newSessionId", () => {
	const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
	const SESSION_ID = /^[A-Za-z0-9_-]{8,100}$/;

	it("uses crypto.randomUUID where the browser has it", () => {
		const id = newSessionId();
		expect(id).toMatch(UUID_V4);
		expect(id).toMatch(SESSION_ID);
	});

	it("builds a version 4 UUID from random bytes where it does not", () => {
		const bytes = Uint8Array.from({ length: 16 }, (_, index) => 0xf0 + index);
		const id = newSessionId({ getRandomValues: (array) => {
			array.set(bytes);
			return array;
		} });

		expect(id).toBe("f0f1f2f3-f4f5-46f7-b8f9-fafbfcfdfeff");
		expect(id).toMatch(UUID_V4);
		expect(id).toMatch(SESSION_ID);
	});
});
