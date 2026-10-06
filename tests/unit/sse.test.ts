import { describe, expect, it } from "vitest";
import { SseDecoder, SseParser, type SseEvent } from "../../app/utils/chat/sse";

// A stream like the assistant's, plus the awkward things the standard allows: a
// comment, CRLF and bare CR line ends, a field with no space after its colon, an
// event with no type, a data field over two lines, fields this parser reads past,
// characters of two, three and four bytes, and an event the stream ends in the
// middle of.
const STREAM = [
	": connected\n\n",
	"event: route\n",
	"data: {\"classification\":\"mihail_related\"}\n\n",
	": ping\n\n",
	"event: token\r\n",
	"data: {\"text\":\"Grüße, \"}\r\n\r\n",
	"event:token\r",
	"data:{\"text\":\"€5 😀\"}\r\r",
	"data: first line\n",
	"data: second line\n\n",
	"id: 7\nretry: 1000\nevent: done\n",
	"data: {\"message_id\":6}\n\n",
	"event: token\n",
	"data: {\"text\":\"never dispatched\"}\n",
].join("");

const EXPECTED: SseEvent[] = [
	{ event: "route", data: "{\"classification\":\"mihail_related\"}" },
	{ event: "token", data: "{\"text\":\"Grüße, \"}" },
	{ event: "token", data: "{\"text\":\"€5 😀\"}" },
	{ event: "message", data: "first line\nsecond line" },
	{ event: "done", data: "{\"message_id\":6}" },
];

function parse(pieces: string[]): SseEvent[] {
	const parser = new SseParser();
	return pieces.flatMap((piece) => parser.push(piece));
}

function decode(chunks: Uint8Array[]): SseEvent[] {
	const decoder = new SseDecoder();
	return chunks.flatMap((chunk) => decoder.push(chunk));
}

describe("SseParser", () => {
	it("reads the whole stream", () => {
		expect(parse([STREAM])).toEqual(EXPECTED);
	});

	it("gives the same events however the text is split in two", () => {
		for (let at = 0; at <= STREAM.length; at++) {
			expect(parse([STREAM.slice(0, at), STREAM.slice(at)]), `split at ${at}`).toEqual(EXPECTED);
		}
	});

	it("gives the same events one character at a time", () => {
		expect(parse(STREAM.split(""))).toEqual(EXPECTED);
	});

	it("counts a CRLF split across two pieces as one line end", () => {
		// Counted as two, the LF would be a blank line that dispatched "a" on its own.
		expect(parse(["data: a\r", "\ndata: b\n\n"])).toEqual([{ event: "message", data: "a\nb" }]);
	});

	it("never dispatches an event the stream ended in the middle of", () => {
		expect(parse(["event: done\ndata: {}\n"])).toEqual([]);
	});

	it("ignores a byte order mark at the start of the stream, and only there", () => {
		const mark = String.fromCharCode(0xfeff);
		expect(parse([`${mark}data: x\n\n`])).toEqual([{ event: "message", data: "x" }]);
		expect(parse(["data: x\n\n", `${mark}data: y\n\n`])).toEqual([
			{ event: "message", data: "x" },
			// Not the start of the stream, so the mark is part of a field name there, and
			// the field is not `data`.
		]);
	});

	it("dispatches an empty data field, and not an event with no data at all", () => {
		expect(parse(["data\n\n", "event: route\n\n"])).toEqual([{ event: "message", data: "" }]);
	});

	it("keeps a colon inside the value", () => {
		expect(parse(["data: a: b\n\n"])).toEqual([{ event: "message", data: "a: b" }]);
	});
});

describe("SseDecoder", () => {
	const bytes = new TextEncoder().encode(STREAM);

	it("gives the same events however the bytes are split in two", () => {
		for (let at = 0; at <= bytes.length; at++) {
			expect(decode([bytes.slice(0, at), bytes.slice(at)]), `split at byte ${at}`).toEqual(EXPECTED);
		}
	});

	it("gives the same events one byte at a time, so no character is broken", () => {
		expect(decode(Array.from(bytes, (byte) => Uint8Array.of(byte)))).toEqual(EXPECTED);
	});
});
