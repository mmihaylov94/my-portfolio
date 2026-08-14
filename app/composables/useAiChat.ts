const chatRootSelector = "#n8n-chat";
const chatWindowSelector = `${chatRootSelector} .chat-window`;
const chatToggleSelector = `${chatRootSelector} .chat-window-toggle`;

/** Opens the n8n chat widget mounted by AiChatPopup in the default layout. */
export function useAiChat() {
	function openChat() {
		if (typeof document === "undefined") return;

		// Already open, so leave it alone rather than toggling it shut.
		if (document.querySelector(chatWindowSelector)) return;

		const toggle = document.querySelector<HTMLElement>(chatToggleSelector);
		if (toggle) toggle.click();
	}

	return {
		openChat,
	};
}
