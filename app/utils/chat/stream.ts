// One answer from the assistant, read as it is written.
//
// The site's API relays the assistant's server-sent events from POST /api/chat
// (api/src/chat.js). What those events carry is portfolio-ai's contract, in its
// docs/API.md: `route` once, `search` per search, `token` many times, then exactly
// one of `done` or `error`.

import { SseDecoder, type SseEvent } from "./sse";
import type { Citation } from "./types";

/** Once, first: which of the assistant's three routes the question took. */
export interface RouteEvent { type: "route"; classification: string }
/** Once per search of the knowledge base. */
export interface SearchEvent { type: "search" }
/** Some words of the answer, always whole ones. */
export interface TokenEvent { type: "token"; text: string }
/** The end of a successful answer. */
export interface DoneEvent { type: "done"; messageId: number | null; citations: Citation[] }
/** The end of an answer that failed after it began. */
export interface FailedEvent { type: "error"; status: number; detail: string }

export type ChatEvent = RouteEvent | SearchEvent | TokenEvent | DoneEvent | FailedEvent;

/** The API refused before the answer began: a status, its sentence, and when to retry. */
export class ChatHttpError extends Error {
	readonly status: number;
	readonly detail: string;
	/** Seconds from `Retry-After`, when the response carried one. */
	readonly retryAfter: number | null;

	constructor(status: number, detail: string, retryAfter: number | null) {
		super(`chat request failed with ${status}`);
		this.name = "ChatHttpError";
		this.status = status;
		this.detail = detail;
		this.retryAfter = retryAfter;
	}
}

/**
 * The answer stopped arriving.
 *
 * - `network`: the request failed, or the connection broke.
 * - `stalled`: nothing arrived for longer than the watchdog allows.
 * - `ended`: the stream closed without its `done` or `error` event.
 * - `aborted`: the caller stopped reading, as "New conversation" does.
 */
export class ChatStreamError extends Error {
	readonly reason: "network" | "stalled" | "ended" | "aborted";

	constructor(reason: ChatStreamError["reason"]) {
		super(`chat stream ${reason}`);
		this.name = "ChatStreamError";
		this.reason = reason;
	}
}

// The assistant pings every 15 seconds while it is quiet, and the site's API ends a
// stream that has been silent for 65. Waiting longer than both means the API's own
// error event arrives first whenever the API is still there to send it.
export const WATCHDOG_MS = 75_000;

const UNAVAILABLE = "The assistant is unavailable right now. Please try again in a moment.";
const TOO_MANY = "That is a lot of questions in a short time. Please wait a little.";
const SOMETHING_WRONG = "Something went wrong. Please try again.";

/** The sentence for a refusal whose body said nothing usable, such as a proxy's HTML page. */
export function fallbackDetail(status: number): string {
	if (status === 429) return TOO_MANY;
	// 502 to 504, and Cloudflare's own 520 to 527.
	if ((status >= 502 && status <= 504) || (status >= 520 && status <= 527)) return UNAVAILABLE;
	return SOMETHING_WRONG;
}

function retryAfterSeconds(header: string | null): number | null {
	// Seconds only. An HTTP date is legal, but neither the site's API nor the
	// assistant sends one.
	if (header === null || !/^\d{1,6}$/.test(header.trim())) return null;
	return Number(header.trim());
}

async function refusal(response: Response): Promise<ChatHttpError> {
	let detail: string | null = null;
	try {
		const body: unknown = await response.json();
		if (isRecord(body) && typeof body.error === "string" && body.error.trim() !== "") {
			detail = body.error;
		}
	} catch {
		// Not JSON; the status decides the sentence.
	}
	return new ChatHttpError(
		response.status,
		detail ?? fallbackDetail(response.status),
		retryAfterSeconds(response.headers.get("retry-after")),
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function citationsFrom(value: unknown): Citation[] {
	if (!Array.isArray(value)) return [];
	const citations: Citation[] = [];
	for (const item of value) {
		if (!isRecord(item) || typeof item.doc_id !== "string" || typeof item.title !== "string") continue;
		citations.push({
			docId: item.doc_id,
			title: item.title,
			url: typeof item.url === "string" ? item.url : null,
			section: typeof item.section === "string" ? item.section : null,
		});
	}
	return citations;
}

/**
 * One server-sent event as a chat event, or null for one this code does not know,
 * or whose data is not what the contract says. Unknown events are skipped rather
 * than fatal, so the assistant can add one without breaking the page.
 */
export function toChatEvent({ event, data }: SseEvent): ChatEvent | null {
	let payload: unknown;
	try {
		payload = JSON.parse(data);
	} catch {
		return null;
	}
	if (!isRecord(payload)) return null;

	switch (event) {
		case "route":
			return typeof payload.classification === "string"
				? { type: "route", classification: payload.classification }
				: null;
		case "search":
			return { type: "search" };
		case "token":
			return typeof payload.text === "string" ? { type: "token", text: payload.text } : null;
		case "done": {
			const id = payload.message_id;
			if (id !== null && !(typeof id === "number" && Number.isSafeInteger(id) && id > 0)) return null;
			return { type: "done", messageId: id, citations: citationsFrom(payload.citations) };
		}
		case "error":
			return {
				type: "error",
				status: typeof payload.status === "number" ? payload.status : 500,
				detail:
					typeof payload.detail === "string" && payload.detail.trim() !== ""
						? payload.detail
						: SOMETHING_WRONG,
			};
		default:
			return null;
	}
}

export interface StreamChatOptions {
	sessionId: string;
	message: string;
	/** Aborting it stops the reading. The answer still finishes, and is stored, on the server. */
	signal?: AbortSignal;
	onEvent: (event: ChatEvent) => void;
	fetch?: typeof globalThis.fetch;
	watchdogMs?: number;
}

/**
 * Ask one question and hand each event of the answer to `onEvent` as it arrives.
 *
 * Resolves after the `done` or `error` event. Rejects with a {@link ChatHttpError}
 * when the API refuses before the answer begins, and with a {@link ChatStreamError}
 * when the answer stops arriving.
 */
export async function streamChat(options: StreamChatOptions): Promise<void> {
	const { sessionId, message, signal, onEvent } = options;
	const doFetch = options.fetch ?? globalThis.fetch;
	const watchdogMs = options.watchdogMs ?? WATCHDOG_MS;

	if (signal?.aborted) throw new ChatStreamError("aborted");

	// One controller for everything that can stop the request: the caller's signal,
	// linked by hand because AbortSignal.any() needs Safari 17.4, and the watchdog.
	const controller = new AbortController();
	let stalled = false;
	const stopForCaller = () => controller.abort();
	signal?.addEventListener("abort", stopForCaller, { once: true });

	let watchdog: ReturnType<typeof setTimeout> | undefined;
	const armWatchdog = () => {
		clearTimeout(watchdog);
		watchdog = setTimeout(() => {
			stalled = true;
			controller.abort();
		}, watchdogMs);
	};
	const failure = () =>
		new ChatStreamError(signal?.aborted ? "aborted" : stalled ? "stalled" : "network");

	armWatchdog();
	try {
		const response = await doFetch("/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
			body: JSON.stringify({ session_id: sessionId, message }),
			signal: controller.signal,
		}).catch(() => {
			throw failure();
		});

		if (!response.ok) throw await refusal(response);
		const contentType = response.headers.get("content-type") ?? "";
		if (!contentType.startsWith("text/event-stream") || response.body === null) {
			throw new ChatHttpError(502, SOMETHING_WRONG, null);
		}

		const reader = response.body.getReader();
		const decoder = new SseDecoder();
		try {
			for (;;) {
				const chunk = await reader.read().catch(() => {
					throw failure();
				});
				// The end of the stream, before `done` or `error`. Whatever the decoder
				// still holds is at most part of an event, which is never dispatched.
				if (chunk.done) throw new ChatStreamError(signal?.aborted ? "aborted" : "ended");
				armWatchdog();

				for (const sse of decoder.push(chunk.value)) {
					const event = toChatEvent(sse);
					if (event === null) continue;
					onEvent(event);
					if (event.type === "done" || event.type === "error") return;
				}
			}
		} finally {
			// Let go of the connection whichever way this ends; after `done` the
			// server closes it anyway.
			reader.cancel().catch(() => {});
		}
	} finally {
		clearTimeout(watchdog);
		signal?.removeEventListener("abort", stopForCaller);
	}
}
