// A thumbs up or down on one answer, through the site's API to the assistant's
// POST /v1/messages/{message_id}/feedback. Voting again replaces the earlier vote,
// comment and all, so a change of mind is just another call.

export interface FeedbackOptions {
	sessionId: string;
	messageId: number;
	rating: 1 | -1;
	comment?: string;
	fetch?: typeof globalThis.fetch;
	timeoutMs?: number;
}

const FEEDBACK_TIMEOUT_MS = 15_000;

/** True once the rating is stored; false for any failure, which the caller shows. */
export async function postFeedback(options: FeedbackOptions): Promise<boolean> {
	const doFetch = options.fetch ?? globalThis.fetch;
	const body: Record<string, unknown> = {
		session_id: options.sessionId,
		message_id: options.messageId,
		rating: options.rating,
	};
	const comment = options.comment?.trim();
	if (comment) body.comment = comment;

	// By hand rather than AbortSignal.timeout(), which Safari only has from 16.
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? FEEDBACK_TIMEOUT_MS);
	try {
		const response = await doFetch("/api/chat/feedback", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
			signal: controller.signal,
		});
		return response.status === 204;
	} catch {
		return false;
	} finally {
		clearTimeout(timer);
	}
}
