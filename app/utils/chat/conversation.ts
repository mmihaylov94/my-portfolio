// The conversation: its messages, the answer being written, and what to do when
// the assistant says "not now".
//
// The state is a Vue `reactive` object, so the components render straight from it,
// but nothing here touches the page: the storage, the network, the clock and the
// frame scheduler all come in as dependencies, which is what lets the tests run it
// in Node.

import { reactive } from "vue";
import { postFeedback } from "./feedback";
import { MAX_QUESTION, codePoints } from "./limits";
import { MAX_MESSAGES, loadConversation, newSessionId, randomId, saveConversation, type StorageLike } from "./sessionStore";
import { ChatHttpError, ChatStreamError, streamChat, type ChatEvent } from "./stream";
import type { Answer, ChatMessage } from "./types";

// A 409 means this conversation's previous answer is still being written: usually
// one the visitor reloaded the page in the middle of, which the assistant finishes
// regardless. Three tries over sixteen seconds see most answers out.
export const CONFLICT_DELAYS_MS: readonly number[] = [3000, 5000, 8000];

// A 503 that says to come back within this many seconds (the assistant sends 5
// when it is busy or restarting) gets one quiet retry before the visitor sees it.
const SHORT_WAIT_SECONDS = 10;

const TOO_SLOW = "The assistant took too long to respond. Please try again.";
const INTERRUPTED = "The answer was interrupted. Please try again.";
const UNREACHABLE = "The assistant could not be reached. Please check your connection and try again.";
const SOMETHING_WRONG = "Something went wrong. Please try again.";

export interface ConversationState {
	sessionId: string;
	messages: ChatMessage[];
	/** Whether an answer is being written. There is only ever one. */
	busy: boolean;
}

export interface ConversationDeps {
	storage: StorageLike | null;
	fetch?: typeof globalThis.fetch;
	now?: () => number;
	/**
	 * Runs a callback before the next repaint: requestAnimationFrame in the browser.
	 * Words arrive faster than a screen redraws, so they are gathered and applied to
	 * the state once a frame rather than once a word.
	 */
	schedule?: (callback: () => void) => void;
	sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
	watchdogMs?: number;
}

export interface Conversation {
	readonly state: ConversationState;
	/** Ask a question. Does nothing while an answer is being written. */
	send(text: string): Promise<void>;
	/** Ask the last question again, after its answer failed or was interrupted. */
	retry(): Promise<void>;
	/** "New conversation": stop reading, forget everything, and start a new session. */
	reset(): void;
	/** Rate an answer. False if it could not be sent; the rating is then put back. */
	rate(answer: Answer, rating: 1 | -1, comment?: string): Promise<boolean>;
	/** Save now, including words not yet shown; for when the page is going away. */
	persist(): void;
}

/** Wait `ms`, or less if `signal` aborts first. Never rejects. */
export function sleep(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve) => {
		if (signal.aborted) {
			resolve();
			return;
		}
		const finish = () => {
			clearTimeout(timer);
			signal.removeEventListener("abort", finish);
			resolve();
		};
		const timer = setTimeout(finish, ms);
		signal.addEventListener("abort", finish, { once: true });
	});
}

export function createConversation(deps: ConversationDeps): Conversation {
	const now = deps.now ?? Date.now;
	const schedule = deps.schedule ?? ((callback: () => void) => callback());
	const wait = deps.sleep ?? sleep;

	const restored = loadConversation(deps.storage, now());
	const state = reactive<ConversationState>({
		sessionId: restored?.sessionId ?? newSessionId(),
		messages: restored?.messages ?? [],
		busy: false,
	});

	// Bumped by reset(). An answer started before it belongs to a conversation that
	// no longer exists: when its reading stops, it must leave the new one alone.
	let generation = 0;
	let reading: AbortController | null = null;
	let writing: Answer | null = null;
	let unshown = "";
	let frameRequested = false;

	function showWords(): void {
		frameRequested = false;
		if (writing === null || unshown === "") return;
		writing.text += unshown;
		unshown = "";
		if (writing.status === "pending" || writing.status === "searching") writing.status = "streaming";
	}

	function persist(): void {
		showWords();
		saveConversation(deps.storage, { sessionId: state.sessionId, messages: state.messages });
	}

	function handle(event: ChatEvent, answer: Answer): void {
		switch (event.type) {
			case "route":
				// Only the knowledge-base route searches; the others answer straight away.
				if (event.classification === "mihail_related" && answer.status === "pending") answer.status = "searching";
				break;
			case "search":
				if (answer.status === "pending") answer.status = "searching";
				break;
			case "token":
				unshown += event.text;
				if (!frameRequested) {
					frameRequested = true;
					schedule(showWords);
				}
				break;
			case "done":
				// Every word first, so the answer is whole before it says it is done.
				showWords();
				answer.messageId = event.messageId;
				answer.citations = event.citations;
				answer.status = "done";
				break;
			case "error":
				showWords();
				answer.status = "error";
				answer.error = event.detail;
				break;
		}
	}

	function fail(answer: Answer, error: unknown): void {
		showWords();
		answer.status = "error";
		if (error instanceof ChatHttpError) {
			answer.error = error.detail;
		} else if (error instanceof ChatStreamError) {
			if (error.reason === "stalled") answer.error = TOO_SLOW;
			else if (error.reason === "network" && answer.text === "") answer.error = UNREACHABLE;
			else answer.error = INTERRUPTED;
		} else {
			// A bug here rather than a failure out there.
			console.error(error);
			answer.error = SOMETHING_WRONG;
		}
	}

	/** How long to wait before asking again, or null to give up and say why. */
	function retryDelay(error: unknown, conflicts: number, waitedForBusy: boolean): number | null {
		if (!(error instanceof ChatHttpError)) return null;
		if (error.status === 409) return CONFLICT_DELAYS_MS[conflicts] ?? null;
		if (error.status === 503 && !waitedForBusy && error.retryAfter !== null && error.retryAfter <= SHORT_WAIT_SECONDS) {
			return Math.max(1, error.retryAfter) * 1000;
		}
		return null;
	}

	async function write(answer: Answer): Promise<void> {
		const mine = generation;
		const controller = new AbortController();
		reading = controller;
		writing = answer;
		state.busy = true;

		let conflicts = 0;
		let waitedForBusy = false;
		try {
			for (;;) {
				try {
					await streamChat({
						sessionId: state.sessionId,
						message: answer.question,
						signal: controller.signal,
						fetch: deps.fetch,
						watchdogMs: deps.watchdogMs,
						onEvent: (event) => {
							if (mine === generation) handle(event, answer);
						},
					});
					return;
				} catch (error) {
					if (mine !== generation) return;
					const delay = retryDelay(error, conflicts, waitedForBusy);
					if (delay === null) {
						fail(answer, error);
						return;
					}
					if (error instanceof ChatHttpError && error.status === 409) conflicts++;
					else waitedForBusy = true;
					await wait(delay, controller.signal);
					if (mine !== generation) return;
				}
			}
		} finally {
			if (mine === generation) {
				showWords();
				reading = null;
				writing = null;
				state.busy = false;
				persist();
			}
		}
	}

	async function send(text: string): Promise<void> {
		const question = text.trim();
		if (state.busy || question === "" || codePoints(question) > MAX_QUESTION) return;

		const at = now();
		state.messages.push({ id: randomId(), role: "user", text: question, at });
		state.messages.push({
			id: randomId(),
			role: "assistant",
			question,
			text: "",
			status: "pending",
			messageId: null,
			citations: [],
			error: null,
			rating: null,
			commented: false,
			at,
		});
		if (state.messages.length > MAX_MESSAGES) state.messages.splice(0, state.messages.length - MAX_MESSAGES);

		// Read back from the reactive array rather than kept from above: Vue wraps an
		// object in its reactive proxy as it is read out of reactive state, and only
		// changes made through that proxy reach the page.
		const answer = state.messages[state.messages.length - 1];
		if (answer === undefined || answer.role !== "assistant") return;
		persist();
		await write(answer);
	}

	async function retry(): Promise<void> {
		const last = state.messages[state.messages.length - 1];
		if (state.busy || last === undefined || last.role !== "assistant") return;
		if (last.status !== "error" && last.status !== "interrupted") return;

		Object.assign(last, {
			text: "",
			status: "pending",
			messageId: null,
			citations: [],
			error: null,
			rating: null,
			commented: false,
			at: now(),
		} satisfies Partial<Answer>);
		persist();
		await write(last);
	}

	function reset(): void {
		generation++;
		// Stops the reading only: the assistant still finishes the answer, and stores
		// it under the old session, which nothing here will ask about again.
		reading?.abort();
		reading = null;
		writing = null;
		unshown = "";
		frameRequested = false;
		state.busy = false;
		state.sessionId = newSessionId();
		state.messages = [];
		persist();
	}

	async function rate(answer: Answer, rating: 1 | -1, comment?: string): Promise<boolean> {
		if (answer.messageId === null) return false;
		const mine = generation;
		const before = { rating: answer.rating, commented: answer.commented };
		answer.rating = rating;
		answer.commented = comment !== undefined && comment.trim() !== "";

		const stored = await postFeedback({
			sessionId: state.sessionId,
			messageId: answer.messageId,
			rating,
			comment,
			fetch: deps.fetch,
		});
		if (mine !== generation) return stored;
		if (!stored) {
			answer.rating = before.rating;
			answer.commented = before.commented;
		}
		persist();
		return stored;
	}

	return { state, send, retry, reset, rate, persist };
}
