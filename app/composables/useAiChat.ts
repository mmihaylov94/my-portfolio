/**
 * Whether the chat panel is open. Shared by the launcher, the panel, and anything
 * else that opens it, such as the "Ask the assistant" button on the assistant's
 * project card. `useState` rather than a module variable, so that prerendering one
 * page never leaks state into another.
 */
export function useAiChat() {
	const isOpen = useState("ai-chat-open", () => false);
	// Whether the open panel is the full-screen one of narrow screens. A link in an
	// answer that leads elsewhere on the site closes that one, so the visitor sees
	// where it went; the corner panel of wide screens stays open beside the page.
	const isModal = useState("ai-chat-modal", () => false);

	function openChat() {
		isOpen.value = true;
	}

	function closeChat() {
		isOpen.value = false;
	}

	return {
		isOpen,
		isModal,
		openChat,
		closeChat,
	};
}
