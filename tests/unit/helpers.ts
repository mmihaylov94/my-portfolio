// Stand-ins for the network and the browser, shared by the chat's tests.

import type { StorageLike } from "../../app/utils/chat/sessionStore";

const encoder = new TextEncoder();

/** One server-sent event, as the assistant writes it. */
export function sse(event: string, data: unknown): string {
	return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/** A complete event stream: every chunk at once, then the end. */
export function streamResponse(chunks: string[]): Response {
	const body = new ReadableStream<Uint8Array>({
		start(controller) {
			for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
			controller.close();
		},
	});
	return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

/** A refusal before any answer, as the site's API sends one. */
export function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json", ...headers },
	});
}

/**
 * An event stream the test writes to as it goes, which fails the way a real one
 * does when its request is aborted.
 */
export function liveStream() {
	let controller!: ReadableStreamDefaultController<Uint8Array>;
	const body = new ReadableStream<Uint8Array>({
		start(streamController) {
			controller = streamController;
		},
	});
	let closed = false;
	const finish = (error?: unknown) => {
		if (closed) return;
		closed = true;
		if (error === undefined) controller.close();
		else controller.error(error);
	};
	return {
		response(signal?: AbortSignal | null): Response {
			signal?.addEventListener("abort", () => finish(new DOMException("The request was aborted.", "AbortError")));
			return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
		},
		push(text: string): void {
			if (!closed) controller.enqueue(encoder.encode(text));
		},
		pushBytes(bytes: Uint8Array): void {
			if (!closed) controller.enqueue(bytes);
		},
		end(): void {
			finish();
		},
		fail(): void {
			finish(new TypeError("network error"));
		},
	};
}

export interface Call {
	url: string;
	init: RequestInit;
	/** The JSON the request carried. */
	body: unknown;
}

/**
 * A fetch that answers from `respond` and remembers what it was asked. `respond` may
 * return a Response or throw, as fetch rejects for a failed connection.
 */
export function fakeFetch(respond: (call: Call, index: number) => Response | Promise<Response>) {
	const calls: Call[] = [];
	const fetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
		const call: Call = {
			url: String(input),
			init,
			body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
		};
		calls.push(call);
		return respond(call, calls.length - 1);
	};
	return { fetch: fetch as typeof globalThis.fetch, calls };
}

/** localStorage, in memory. */
export function memoryStorage(): StorageLike & { data: Map<string, string> } {
	const data = new Map<string, string>();
	return {
		data,
		getItem: (key) => data.get(key) ?? null,
		setItem: (key, value) => {
			data.set(key, value);
		},
		removeItem: (key) => {
			data.delete(key);
		},
	};
}

/** Storage that refuses everything, as a blocked or private browser's can. */
export function brokenStorage(): StorageLike {
	const refuse = () => {
		throw new DOMException("The operation is insecure.", "SecurityError");
	};
	return { getItem: refuse, setItem: refuse, removeItem: refuse };
}

/** Let every pending promise and stream read settle. */
export async function settle(): Promise<void> {
	for (let i = 0; i < 20; i++) await new Promise<void>((resolve) => setImmediate(resolve));
}
