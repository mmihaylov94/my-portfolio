// The conversation, kept in the visitor's browser so a reload does not lose it.
//
// The assistant has no endpoint that returns a conversation, so this copy is the
// only one the page can show. It lasts 24 hours from the last question; after that,
// or after "New conversation", the next question starts a new session, which the
// assistant remembers nothing of.

import type { Answer, AnswerStatus, ChatMessage, Citation } from "./types";

export const STORAGE_KEY = "portfolio-chat/v1";
export const RESUME_WITHIN_MS = 24 * 60 * 60 * 1000;

// 25 exchanges, which is also how far back the assistant's own memory reaches.
export const MAX_MESSAGES = 50;

// A clock that has moved back a little should not throw a conversation away.
const CLOCK_SKEW_MS = 5 * 60 * 1000;

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface StoredConversation {
	sessionId: string;
	messages: ChatMessage[];
}

// The assistant's own rule for session ids (portfolio-ai, docs/API.md).
const SESSION_ID = /^[A-Za-z0-9_-]{8,100}$/;
const STATUSES: ReadonlySet<string> = new Set<AnswerStatus>([
	"pending",
	"searching",
	"streaming",
	"done",
	"error",
	"interrupted",
]);

/**
 * The saved conversation, if there is one worth resuming.
 *
 * Every field is checked, and a record that fails any check is discarded whole: it
 * was written by an older version of this code, or edited by hand, and a half-read
 * conversation is worse than a fresh one. So is one more than 24 hours old. An
 * answer that was still arriving when the page went away comes back interrupted.
 */
export function loadConversation(storage: StorageLike | null, now: number): StoredConversation | null {
	if (storage === null) return null;

	let raw: string | null;
	try {
		raw = storage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
	if (raw === null) return null;

	const conversation = parseConversation(raw);
	const last = conversation === null ? Number.NaN : Math.max(...conversation.messages.map((message) => message.at));
	const age = now - last;
	if (conversation === null || !(age >= -CLOCK_SKEW_MS && age <= RESUME_WITHIN_MS)) {
		forget(storage);
		return null;
	}

	return {
		sessionId: conversation.sessionId,
		messages: conversation.messages.map((message): ChatMessage =>
			message.role === "assistant" && isLive(message.status) ? { ...message, status: "interrupted" } : message,
		),
	};
}

/**
 * Save the conversation. Storage that is full, blocked, or unavailable in a private
 * window is not an error: the conversation carries on in memory, and is simply not
 * there after a reload.
 */
export function saveConversation(storage: StorageLike | null, conversation: StoredConversation): void {
	if (storage === null) return;
	if (conversation.messages.length === 0) {
		forget(storage);
		return;
	}
	try {
		storage.setItem(
			STORAGE_KEY,
			JSON.stringify({ sessionId: conversation.sessionId, messages: conversation.messages.slice(-MAX_MESSAGES) }),
		);
	} catch {
		// See above.
	}
}

function forget(storage: StorageLike): void {
	try {
		storage.removeItem(STORAGE_KEY);
	} catch {
		// Nothing was readable either.
	}
}

function isLive(status: AnswerStatus): boolean {
	return status === "pending" || status === "searching" || status === "streaming";
}

type RandomSource = { getRandomValues(array: Uint8Array): Uint8Array; randomUUID?: () => string };

/**
 * A new session id: a random UUID.
 *
 * `crypto.randomUUID()` exists only on secure origins, so a phone trying the dev
 * server over the network, on plain http, does without it. The fallback builds the
 * same kind of UUID, version 4, from random bytes, which every origin has.
 */
export function newSessionId(random: RandomSource = globalThis.crypto): string {
	if (typeof random.randomUUID === "function") return random.randomUUID();
	const bytes = random.getRandomValues(new Uint8Array(16));
	bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40; // version 4
	bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // the RFC 4122 variant
	const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** An id for one message on this page, for Vue's keys. */
export function randomId(random: RandomSource = globalThis.crypto): string {
	return Array.from(random.getRandomValues(new Uint8Array(8)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// --- Reading a record back ----------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTime(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

// What the helpers below return for a value that fails its check.
const INVALID = Symbol("invalid");

function stringOrNull(value: unknown): string | null | typeof INVALID {
	return value === null || typeof value === "string" ? value : INVALID;
}

function messageIdOrNull(value: unknown): number | null | typeof INVALID {
	if (value === null) return null;
	return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : INVALID;
}

function ratingOrNull(value: unknown): 1 | -1 | null | typeof INVALID {
	return value === null || value === 1 || value === -1 ? value : INVALID;
}

function parseConversation(raw: string): StoredConversation | null {
	let data: unknown;
	try {
		data = JSON.parse(raw);
	} catch {
		return null;
	}
	if (!isRecord(data) || typeof data.sessionId !== "string" || !SESSION_ID.test(data.sessionId)) return null;
	if (!Array.isArray(data.messages) || data.messages.length === 0) return null;

	const messages: ChatMessage[] = [];
	for (const item of data.messages.slice(-MAX_MESSAGES)) {
		const message = parseMessage(item);
		if (message === null) return null;
		messages.push(message);
	}
	return { sessionId: data.sessionId, messages };
}

function parseMessage(item: unknown): ChatMessage | null {
	if (!isRecord(item) || typeof item.id !== "string" || item.id === "" || !isTime(item.at)) return null;
	if (item.role === "user") {
		return typeof item.text === "string" ? { id: item.id, role: "user", text: item.text, at: item.at } : null;
	}
	if (item.role !== "assistant") return null;

	const { question, text, status, commented } = item;
	if (typeof question !== "string" || typeof text !== "string") return null;
	if (typeof status !== "string" || !STATUSES.has(status)) return null;
	if (typeof commented !== "boolean") return null;
	const messageId = messageIdOrNull(item.messageId);
	const error = stringOrNull(item.error);
	const rating = ratingOrNull(item.rating);
	const citations = parseCitations(item.citations);
	if (messageId === INVALID || error === INVALID || rating === INVALID || citations === null) return null;

	const answer: Answer = {
		id: item.id,
		role: "assistant",
		question,
		text,
		// Checked against STATUSES above; a Set's `has` cannot narrow a string by itself.
		status: status as AnswerStatus,
		messageId,
		citations,
		error,
		rating,
		commented,
		at: item.at,
	};
	return answer;
}

function parseCitations(value: unknown): Citation[] | null {
	if (!Array.isArray(value)) return null;
	const citations: Citation[] = [];
	for (const item of value) {
		if (!isRecord(item) || typeof item.docId !== "string" || typeof item.title !== "string") return null;
		const url = stringOrNull(item.url);
		const section = stringOrNull(item.section);
		if (url === INVALID || section === INVALID) return null;
		citations.push({ docId: item.docId, title: item.title, url, section });
	}
	return citations;
}
