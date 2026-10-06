// The shapes a conversation is made of, shared by the stream, the state machine,
// the browser's copy of the conversation, and the components that show it.

/** A document an answer drew on, from the `done` event. */
export interface Citation {
	docId: string;
	title: string;
	url: string | null;
	section: string | null;
}

/**
 * Where an answer is.
 *
 * - `pending`: asked, nothing back yet.
 * - `searching`: the assistant is searching the knowledge base.
 * - `streaming`: the answer is arriving.
 * - `done`: the answer is complete. It was stored if `messageId` is set; the
 *   daily-limit reply, which is not, comes as `done` with `messageId` null.
 * - `error`: it failed; `error` says why, and any text that arrived stays.
 * - `interrupted`: the page went away while it was arriving. The assistant still
 *   finished and stored it, but there is no way to fetch it back.
 */
export type AnswerStatus = "pending" | "searching" | "streaming" | "done" | "error" | "interrupted";

export interface Question {
	id: string;
	role: "user";
	text: string;
	/** When it was asked, in milliseconds since the epoch. */
	at: number;
}

export interface Answer {
	id: string;
	role: "assistant";
	/** The question this answers, asked again by "Try again". */
	question: string;
	text: string;
	status: AnswerStatus;
	/** The stored answer's id, which feedback is posted against; null until `done`, and for the daily-limit reply. */
	messageId: number | null;
	citations: Citation[];
	/** The sentence shown when `status` is `error`. */
	error: string | null;
	rating: 1 | -1 | null;
	/** Whether a comment went with the thumbs down. */
	commented: boolean;
	at: number;
}

export type ChatMessage = Question | Answer;
