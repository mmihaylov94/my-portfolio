// How a visitor's text is trimmed, measured and checked, shared by the chat and the
// contact routes so that both read a field exactly as the assistant will.

// The assistant trims with Rust's str::trim (pydantic), which strips Unicode
// White_Space. That is neither JavaScript's trim(), which also strips U+FEFF but not
// U+0085, nor Python's str.strip(), which also strips U+001C to U+001F. Spelt out, so
// both sides measure a message the same way. A loop rather than a regular expression,
// because `[\s]+$` backtracks quadratically over a long run of spaces.
const WHITE_SPACE = new Set([
	0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x20, 0x85, 0xa0, 0x1680,
	0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a,
	0x2028, 0x2029, 0x202f, 0x205f, 0x3000,
]);

export function stripWhiteSpace(text) {
	let start = 0;
	let end = text.length;
	while (start < end && WHITE_SPACE.has(text.charCodeAt(start))) start++;
	while (end > start && WHITE_SPACE.has(text.charCodeAt(end - 1))) end--;
	return text.slice(start, end);
}

// C0 control characters and DEL, except tab, line feed and carriage return: what the
// assistant refuses (schemas.py). Checked after trimming, in the same order it does.
export function hasControlCharacter(text) {
	for (let i = 0; i < text.length; i++) {
		const code = text.charCodeAt(i);
		if ((code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) || code === 0x7f) return true;
	}
	return false;
}

// Characters, as Python counts them: code points, so an emoji is one, not two.
export function codePoints(text) {
	return [...text].length;
}
