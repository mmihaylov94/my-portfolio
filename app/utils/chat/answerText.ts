// An answer's text as tokens the chat renders itself: paragraphs and lists, strong
// and emphasised text, and links. Nothing here makes HTML, and nothing renders it:
// the components build elements from the tokens, so there is no v-html anywhere and
// no markdown library.
//
// Links follow portfolio-ai's grammar. Its link filter (`_LINK` in
// src/portfolio_ai/assistant/postprocess.py) decides which URLs a visitor may be
// sent to, and it can only police what it recognises as a link. If this code
// recognised more, a bare "mihaylov.io/projects/x" say, a link the filter never
// looked at would become clickable here. So this is a port of the same pattern, and
// tests/unit/linkParity.test.ts checks it against Python's own matches.

// Python's \s, which the pattern uses, as code point ranges. JavaScript's \s is a
// different set: it lacks U+001C to U+001F and U+0085, and it adds U+FEFF. The
// characters are made here rather than written out, so that none of them is
// invisible in this file.
const PYTHON_SPACE: readonly (readonly [number, number])[] = [
	[0x09, 0x0d],
	[0x1c, 0x20],
	[0x85, 0x85],
	[0xa0, 0xa0],
	[0x1680, 0x1680],
	[0x2000, 0x200a],
	[0x2028, 0x2029],
	[0x202f, 0x202f],
	[0x205f, 0x205f],
	[0x3000, 0x3000],
];
const SPACE = PYTHON_SPACE.map(([from, to]) =>
	from === to
		? String.fromCodePoint(from)
		: `${String.fromCodePoint(from)}-${String.fromCodePoint(to)}`,
).join("");

// [label](target), with an optional title, or a bare https://, http:// or www. URL,
// optionally in angle brackets: one pattern, matched in one pass, as in Python. The
// `u` flag makes the length limits count code points, as Python's do, and lets the
// long s stand for "s" when case is ignored, as Python's IGNORECASE does.
const LINK = new RegExp(
	String.raw`\[(?<label>[^\]\n]{0,300})\]\((?<target>[^)${SPACE}]{0,2000})`
	+ String.raw`(?<title>[ \t]+(?:"[^"\n]{0,300}"|'[^'\n]{0,300}'))?\)`
	+ String.raw`|(?<url><?(?:https?:\/\/|www\.)[^${SPACE}<>()\[\]"'` + "`" + "]+>?)",
	"giu",
);

// Sentence punctuation and closing emphasis after a bare URL are not part of it:
// postprocess.py's _TRAILING_PUNCTUATION and _EMPHASIS.
const TRAILING = ".,;:!?*_";

export interface LinkMatch {
	/** Where the match starts, in UTF-16 code units. */
	index: number;
	match: string;
	label: string | null;
	target: string | null;
	title: string | null;
	url: string | null;
}

/** Every link the grammar finds in `text`, in order, as Python's `_LINK.finditer` would. */
export function findLinks(text: string): LinkMatch[] {
	return Array.from(text.matchAll(LINK), (found) => ({
		index: found.index,
		match: found[0],
		label: found.groups?.label ?? null,
		target: found.groups?.target ?? null,
		title: found.groups?.title ?? null,
		url: found.groups?.url ?? null,
	}));
}

/**
 * A bare URL as the filter sees it: angle brackets off both ends, then sentence
 * punctuation and closing emphasis off the end, in that order, as
 * `url.strip("<>").rstrip(...)` does in Python.
 */
export function bareLink(url: string): string {
	let start = 0;
	let end = url.length;
	while (start < end && "<>".includes(url.charAt(start))) start++;
	while (end > start && "<>".includes(url.charAt(end - 1))) end--;
	while (end > start && TRAILING.includes(url.charAt(end - 1))) end--;
	return url.slice(start, end);
}

const PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * The address a link may point at, or null. Only http, https and mailto become
 * links. The URL parser decides the scheme, so "JavaScript:" and "java<tab>script:"
 * are refused like "javascript:", and a relative address, which has no scheme, is
 * refused too. A www. address gains https://.
 *
 * A backslash is refused outright. The parser reads it as "/" in an http or https
 * address, so "https://mihaylov.io\projects\x" would lead to /projects/x, a path
 * portfolio-ai's link filter never saw: it saw backslashes. The address a browser
 * follows has to be the one the filter judged, and no link worth giving has one.
 */
export function safeHref(written: string): string | null {
	if (written.includes("\\")) return null;
	const candidate = /^www\./i.test(written) ? `https://${written}` : written;
	let url: URL;
	try {
		url = new URL(candidate);
	} catch {
		return null;
	}
	return PROTOCOLS.has(url.protocol) ? url.href : null;
}

export interface TextToken { kind: "text"; text: string }
export interface LinkToken { kind: "link"; href: string; label: string }
export interface StrongToken { kind: "strong"; children: Inline[] }
export interface EmphasisToken { kind: "em"; children: Inline[] }
export type Inline = TextToken | LinkToken | StrongToken | EmphasisToken;

/** Lines of text; each line after the first starts on a new line. */
export interface Paragraph { kind: "paragraph"; lines: Inline[][] }
/** A bulleted or numbered list. `start` is the first item's number. */
export interface List { kind: "list"; ordered: boolean; start: number; items: Inline[][] }
export type Block = Paragraph | List;

// While emphasis is worked out, each link stands in the text as one character from
// Unicode's private use area, so that an underscore or asterisk inside a URL is never
// read as emphasis, and emphasis around a link still wraps it. Private use characters
// in the answer itself are replaced first, so they cannot pass for a link.
const FIRST_SLOT = 0xe000;
const SLOTS = 0xf8ff - FIRST_SLOT + 1;
const PRIVATE_USE = new RegExp(`[${String.fromCharCode(FIRST_SLOT)}-${String.fromCharCode(0xf8ff)}]`, "g");
const REPLACEMENT = String.fromCharCode(0xfffd);

// **strong**, and *emphasis* or _emphasis_, on one line. The delimiters must hug the
// words inside them, and an underscore must not touch a letter outside, so
// snake_case_names and "5 * 3" stay as written.
const STRONG = /\*\*(?=\S)(.*?\S)\*\*/g;
const EMPHASIS = /(^|[^*_\w])(?:\*(?=[^\s*])(.*?[^\s*])\*(?![*\w])|_(?=[^\s_])(.*?[^\s_])_(?![_\w]))/g;

function tokenizeLine(line: string): Inline[] {
	const links: Inline[] = [];
	let masked = "";
	let position = 0;
	const text = (piece: string) => piece.replace(PRIVATE_USE, REPLACEMENT);
	const slot = (link: Inline) => {
		links.push(link);
		return String.fromCharCode(FIRST_SLOT + links.length - 1);
	};

	for (const found of findLinks(line)) {
		masked += text(line.slice(position, found.index));
		position = found.index + found.match.length;

		if (links.length >= SLOTS) {
			masked += text(found.match);
		} else if (found.url !== null) {
			// <https://...> is an autolink, and loses its brackets. A lone bracket stays.
			const opens = found.url.startsWith("<");
			const closes = found.url.length > 1 && found.url.endsWith(">");
			const autolink = opens && closes;
			const inner = found.url.slice(opens ? 1 : 0, closes ? -1 : undefined);
			const link = bareLink(inner);
			const href = safeHref(link);
			masked += opens && !autolink ? "<" : "";
			masked += href === null ? text(link) : slot({ kind: "link", href, label: link });
			masked += text(inner.slice(link.length)) + (closes && !autolink ? ">" : "");
		} else {
			// A link that may not be followed keeps its label and loses the link, as the
			// filter treats a forbidden one.
			const label = found.label ?? "";
			const href = safeHref(found.target ?? "");
			masked += href === null
				? text(label)
				: slot({ kind: "link", href, label: label.trim() === "" ? (found.target ?? "") : label });
		}
	}
	masked += text(line.slice(position));

	return withLinks(strongAndEmphasis(masked), links);
}

function strongAndEmphasis(text: string): Inline[] {
	const nodes: Inline[] = [];
	let last = 0;
	for (const found of text.matchAll(STRONG)) {
		if (found.index > last) nodes.push(...emphasis(text.slice(last, found.index)));
		nodes.push({ kind: "strong", children: emphasis(found[1] ?? "") });
		last = found.index + found[0].length;
	}
	if (last < text.length) nodes.push(...emphasis(text.slice(last)));
	return nodes;
}

function emphasis(text: string): Inline[] {
	const nodes: Inline[] = [];
	let last = 0;
	for (const found of text.matchAll(EMPHASIS)) {
		// The character before the delimiter was matched only to check it; it stays text.
		const start = found.index + (found[1] ?? "").length;
		if (start > last) nodes.push({ kind: "text", text: text.slice(last, start) });
		nodes.push({ kind: "em", children: [{ kind: "text", text: found[2] ?? found[3] ?? "" }] });
		last = found.index + found[0].length;
	}
	if (last < text.length) nodes.push({ kind: "text", text: text.slice(last) });
	return nodes;
}

/** Put the links back where their stand-in characters are. */
function withLinks(nodes: Inline[], links: Inline[]): Inline[] {
	const result: Inline[] = [];
	for (const node of nodes) {
		if (node.kind === "strong" || node.kind === "em") {
			result.push({ kind: node.kind, children: withLinks(node.children, links) });
			continue;
		}
		if (node.kind !== "text") {
			result.push(node);
			continue;
		}
		let run = "";
		for (const char of node.text) {
			const code = char.charCodeAt(0);
			const link = code >= FIRST_SLOT && code < FIRST_SLOT + links.length ? links[code - FIRST_SLOT] : undefined;
			if (link === undefined) {
				run += char;
				continue;
			}
			if (run !== "") result.push({ kind: "text", text: run });
			run = "";
			result.push(link);
		}
		if (run !== "") result.push({ kind: "text", text: run });
	}
	return result;
}

// A line's tokens depend on nothing but the line, so each line is tokenized once.
// While an answer streams in, only its last line changes; every line before it is
// found here.
const lineCache = new Map<string, Inline[]>();
const LINE_CACHE_SIZE = 500;

/** The inline tokens of one line of an answer. */
export function inlineTokens(line: string): Inline[] {
	let nodes = lineCache.get(line);
	if (nodes === undefined) {
		nodes = tokenizeLine(line);
		if (lineCache.size >= LINE_CACHE_SIZE) lineCache.clear();
		lineCache.set(line, nodes);
	}
	return nodes;
}

// "- item", "* item", "+ item", "• item", "1. item" and "1) item".
const LIST_ITEM = /^[ \t]{0,3}(?:([-*+•])|(\d{1,3})[.)])[ \t]+(.*)$/;
// Answers are told not to use headings. One that does gets a bold line instead.
const HEADING = /^[ \t]{0,3}#{1,6}[ \t]+(.*?)[ \t#]*$/;

/** The answer as blocks: paragraphs, whose lines are kept, and lists. */
export function toBlocks(text: string): Block[] {
	const blocks: Block[] = [];
	let paragraph: Inline[][] | null = null;
	let list: List | null = null;

	for (const line of text.split(/\r\n|\r|\n/)) {
		if (line.trim() === "") {
			paragraph = null;
			list = null;
			continue;
		}

		const item = LIST_ITEM.exec(line);
		if (item !== null) {
			const ordered = item[2] !== undefined;
			if (list === null || list.ordered !== ordered) {
				list = { kind: "list", ordered, start: ordered ? Number(item[2]) : 1, items: [] };
				blocks.push(list);
			}
			list.items.push(inlineTokens(item[3] ?? ""));
			paragraph = null;
			continue;
		}

		list = null;
		const heading = HEADING.exec(line);
		const nodes: Inline[] = heading === null
			? inlineTokens(line)
			: [{ kind: "strong", children: inlineTokens(heading[1] ?? "") }];
		if (paragraph === null) {
			paragraph = [];
			blocks.push({ kind: "paragraph", lines: paragraph });
		}
		paragraph.push(nodes);
	}
	return blocks;
}

function flatten(nodes: Inline[]): string {
	return nodes
		.map((node) => (node.kind === "text" ? node.text : node.kind === "link" ? node.label : flatten(node.children)))
		.join("");
}

/** The answer as a screen reader should hear it: the words, without the markup. */
export function plainText(text: string): string {
	return toBlocks(text)
		.map((block) =>
			block.kind === "paragraph" ? block.lines.map(flatten).join(" ") : block.items.map(flatten).join(". "),
		)
		.join(" ");
}
