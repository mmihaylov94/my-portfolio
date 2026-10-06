// The assistant's limits, as its API counts them (portfolio-ai, docs/API.md), so the
// chat can say so before sending rather than after a refusal.

/** The longest question, in characters after trimming. */
export const MAX_QUESTION = 2000;

/** The longest comment on a thumbs down. */
export const MAX_COMMENT = 1000;

/**
 * How many characters `text` is, counted the way the assistant counts them: by code
 * point. `text.length` counts UTF-16 code units, so an emoji would count as two.
 */
export function codePoints(text: string): number {
	let count = 0;
	for (const _ of text) count++;
	return count;
}
