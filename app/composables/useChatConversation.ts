import { createConversation, type Conversation } from "~/utils/chat/conversation";

let conversation: Conversation | undefined;

/**
 * The visitor's conversation: one per page load, shared by every component that
 * shows part of it, so an answer keeps arriving while the panel is closed.
 *
 * It exists only in the browser. Nothing calls this while the site is prerendered,
 * because the only callers are inside the chat panel, which loads on the first
 * click, and a module variable here would be shared by every page prerendered in
 * the same process.
 */
export function useChatConversation(): Conversation {
	if (import.meta.server) throw new Error("useChatConversation() runs only in the browser.");

	if (conversation === undefined) {
		const created = createConversation({
			storage: browserStorage(),
			schedule: (callback) => {
				window.requestAnimationFrame(() => callback());
			},
		});
		// Save when the page goes away, mid-answer included, so a reload can show
		// what had arrived. `visibilitychange` as well as `pagehide`, because a mobile
		// browser that is switched away from may never fire the second.
		window.addEventListener("pagehide", () => created.persist());
		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "hidden") created.persist();
		});
		conversation = created;
	}
	return conversation;
}

function browserStorage(): Storage | null {
	// Reading `localStorage` itself throws where storage is blocked.
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}
