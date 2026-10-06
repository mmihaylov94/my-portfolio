// Server-sent events, parsed the way the HTML standard says a browser's EventSource
// does. EventSource itself cannot be used: it only makes GET requests, and the chat
// is a POST.
//
// https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation

export interface SseEvent {
	/** The `event:` field, or "message" when the event had none. */
	event: string;
	/** Every `data:` line, joined with line feeds. */
	data: string;
}

/**
 * Turns decoded text into events, however the text was split into pieces.
 *
 * A line can end with CRLF, LF or CR, and a piece can end between the CR and the LF
 * of one CRLF. An event is dispatched only at the blank line that ends it, so an
 * event cut off by the end of the stream is never dispatched. `id:` and `retry:` are
 * read past: the assistant sends neither, and a broken answer is asked again rather
 * than resumed.
 */
export class SseParser {
	private line = "";
	private data = "";
	private type = "";
	private started = false;
	private afterCr = false;

	/** Parse the next piece of the stream; returns the events it completed. */
	push(text: string): SseEvent[] {
		const events: SseEvent[] = [];
		let piece = text;

		if (!this.started && piece.length > 0) {
			this.started = true;
			// A byte order mark at the very start of the stream is not part of it.
			if (piece.charCodeAt(0) === 0xfeff) piece = piece.slice(1);
		}
		if (this.afterCr && piece.length > 0) {
			// The previous piece ended with CR: an LF now is the rest of that line end.
			this.afterCr = false;
			if (piece[0] === "\n") piece = piece.slice(1);
		}

		let start = 0;
		for (let i = 0; i < piece.length; i++) {
			const char = piece[i];
			if (char !== "\n" && char !== "\r") continue;

			this.processLine(this.line + piece.slice(start, i), events);
			this.line = "";
			if (char === "\r") {
				if (i + 1 === piece.length) this.afterCr = true;
				else if (piece[i + 1] === "\n") i++;
			}
			start = i + 1;
		}
		this.line += piece.slice(start);
		return events;
	}

	private processLine(line: string, events: SseEvent[]): void {
		if (line === "") {
			// The blank line ends an event, which is dispatched only if it had data.
			if (this.data !== "") {
				events.push({ event: this.type || "message", data: this.data.slice(0, -1) });
			}
			this.data = "";
			this.type = "";
			return;
		}
		if (line.startsWith(":")) return; // a comment, such as the assistant's pings

		const colon = line.indexOf(":");
		const field = colon === -1 ? line : line.slice(0, colon);
		let value = colon === -1 ? "" : line.slice(colon + 1);
		if (value.startsWith(" ")) value = value.slice(1);

		if (field === "event") this.type = value;
		else if (field === "data") this.data += `${value}\n`;
	}
}

/**
 * Bytes in, events out: UTF-8 decoding and parsing together.
 *
 * The decoder runs in streaming mode, so a character whose bytes arrive in two
 * pieces is held back until it is whole, instead of becoming two replacement
 * characters. There is no end-of-stream step: whatever is still held back when a
 * stream ends is at most part of an event, and that is never dispatched.
 */
export class SseDecoder {
	private readonly decoder = new TextDecoder("utf-8");
	private readonly parser = new SseParser();

	push(bytes: Uint8Array): SseEvent[] {
		return this.parser.push(this.decoder.decode(bytes, { stream: true }));
	}
}
