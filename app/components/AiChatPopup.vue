<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import "@n8n/chat/style.css";

declare global {
	interface Window {
		__portfolioN8nChatInitialized?: boolean
	}
}

const config = useRuntimeConfig();
const webhookPath = computed(() => String(config.public.n8nChatWebhookPath ?? "").trim());
const webhookUrl = computed(() => {
	if (!webhookPath.value) return "";
	return `https://n8n.mihaylov.io/webhook/${webhookPath.value}`;
});

const chatSessionStorageKey = "n8n-chat/sessionId";
const chatRootSelector = "#n8n-chat";
const chatHeadingSelector = `${chatRootSelector} .chat-heading`;
const chatWindowSelector = `${chatRootSelector} .chat-window`;
const chatToggleSelector = `${chatRootSelector} .chat-window-toggle`;

let chatObserver: MutationObserver | undefined;
let isRestarting = false;

function normalizeChatHeadingSemantics() {
	const heading = document.querySelector(chatHeadingSelector);
	if (!heading) return;

	// Ensure the chat title does not introduce an extra H1.
	const titleEl =
		heading.querySelector("h1") ??
		heading.querySelector("h2") ??
		heading.querySelector(".chat-title");

	if (!titleEl) return;

	// If the library renders a heading element, replace it with an h3,
	// preserving attributes/classes and content for identical styling.
	if (titleEl.tagName.toLowerCase() === "h3") return;

	const h3 = document.createElement("h3");
	for (const { name, value } of Array.from(titleEl.attributes)) {
		h3.setAttribute(name, value);
	}
	h3.innerHTML = titleEl.innerHTML;
	titleEl.replaceWith(h3);
}

function mountStartOverButton() {
	const heading = document.querySelector(chatHeadingSelector);
	if (!heading || heading.querySelector(".portfolio-chat-reset")) return;

	const button = document.createElement("button");
	button.type = "button";
	button.className = "portfolio-chat-reset";
	button.textContent = "Start over";
	button.addEventListener("click", async (event) => {
		event.preventDefault();
		event.stopPropagation();
		if (isRestarting) return;
		isRestarting = true;
		try {
			const wasOpen = !!document.querySelector(chatWindowSelector);
			localStorage.removeItem(chatSessionStorageKey);
			window.__portfolioN8nChatInitialized = false;
			const target = document.querySelector(chatRootSelector);
			if (target) target.innerHTML = "";
			await initChat();
			if (wasOpen) {
				requestAnimationFrame(() => {
					const toggle = document.querySelector<HTMLElement>(chatToggleSelector);
					if (toggle) toggle.click();
				});
			}
		} finally {
			isRestarting = false;
		}
	});
	heading.append(button);
}

function startObserver() {
	const root = document.querySelector(chatRootSelector);
	if (!root) return;
	chatObserver?.disconnect();
	chatObserver = new MutationObserver(() => {
		normalizeChatHeadingSemantics();
		mountStartOverButton();
	});
	chatObserver.observe(root, { childList: true, subtree: true });
	normalizeChatHeadingSemantics();
	mountStartOverButton();
}

async function initChat() {
	if (!webhookUrl.value) return;
	if (window.__portfolioN8nChatInitialized) return;
	window.__portfolioN8nChatInitialized = true;

	const { createChat } = await import("@n8n/chat");
	createChat({
		webhookUrl: webhookUrl.value,
		target: "#n8n-chat",
		mode: "window",
		showWelcomeScreen: true,
		loadPreviousSession: true,
		i18n: {
			en: {
				title: "Rachel",
				subtitle: "",
				footer: "",
				getStarted: "New Conversation",
				inputPlaceholder: "Type your question...",
				closeButtonTooltip: "Close chat",
			},
		},
		initialMessages: [
			"Hello, I am Rachel, Mihail's personal assistant. I am here to answer any questions you may have about him or his projects. How can I help you?",
		],
	});
	startObserver();
}

onMounted(async () => {
	await initChat();
});

onUnmounted(() => {
	chatObserver?.disconnect();
});
</script>

<template>
	<div id="n8n-chat" />
</template>

<style>
/* Unified @n8n/chat theme mapped to portfolio design tokens */
:root {
	--chat--color--primary: #7bb5cc;
	--chat--color--primary-shade-50: #6a9db3;
	--chat--color--primary--shade-100: #59859a;
	--chat--color--secondary: #e4b88a;
	--chat--color-secondary-shade-50: #d9a570;
	--chat--color-dark: #263a4a;
	--chat--color-light: #f4f8fa;
	--chat--color-light-shade-50: #e9f1f5;
	--chat--color-light-shade-100: #d3e3eb;
	--chat--color-typing: #486d81;

	--chat--font-family: "Teachers", "Cantarell", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	--chat--border-radius: 1rem;
	--chat--window--width: 360px;
	--chat--window--height: 560px;
	--chat--window--border-radius: 1rem;
	--chat--window--border: 1px solid var(--chat--color-light-shade-100);

	--chat--header--background: var(--chat--color--primary);
	--chat--header--color: #fff;
	--chat--heading--font-size: 1.1rem;
	--chat--subtitle--font-size: 0.9rem;

	--chat--message--border-radius: 0.75rem;
	--chat--message--bot--background: #fff;
	--chat--message--bot--color: #1f2937;
	--chat--message--bot--border: 1px solid var(--chat--color-light-shade-100);
	--chat--message--user--background: var(--chat--color--primary);
	--chat--message--user--color: #fff;

	/* Toggle equals previous visual style */
	--chat--toggle--size: 56px;
	--chat--toggle--background: #a7c7d7;
	--chat--toggle--hover--background: #7bb5cc;
	--chat--toggle--active--background: #6a9db3;
	--chat--toggle--color: rgb(255 255 255 / 0.9);

	--chat--body--background: #f4f8fa;
	--chat--footer--background: #f4f8fa;
	--chat--footer--color: #263a4a;
	--chat--footer--border-top: none;

	/* Input area tuning */
	--chat--textarea--height: 40px;
	--chat--input--padding: 0.45rem 0.75rem;
	--chat--input--line-height: 1.35;
	--chat--input--font-size: 0.95rem;
	--chat--input--border-radius: 0.75rem;
	--chat--input--container--background: #fff;
	--chat--input--container--border: 1px solid var(--chat--color-light-shade-100);
	--chat--input--container--border-radius: 0.875rem;
	--chat--input--container--padding: 0.2rem;
	--chat--input--send--button--background: transparent;
	--chat--input--send--button--background-hover: rgb(123 181 204 / 0.12);
	--chat--input--send--button--color: #59859a;
	--chat--input--send--button--color-hover: #486d81;
}

html.dark {
	--chat--header--background: #263a4a;
	--chat--body--background: #111827;
	--chat--footer--background: #111827;
	--chat--footer--color: #f3f4f6;
	--chat--footer--border-top: none;
	--chat--message--bot--background: #374151;
	--chat--message--bot--color: #f3f4f6;
	--chat--message--bot--border: 1px solid #4b5563;
	--chat--toggle--background: #6a9db3;
	--chat--toggle--hover--background: #7bb5cc;
	--chat--toggle--active--background: #59859a;
	--chat--input--container--background: #111827;
	--chat--input--container--border: 1px solid #4b5563;
	--chat--input--background: #111827;
	--chat--input--text-color: #f3f4f6;
	--chat--input--send--button--color: #a7c7d7;
	--chat--input--send--button--color-hover: #7bb5cc;
	--chat--input--send--button--background-hover: rgb(167 199 215 / 0.14);
}

/* Keep message width similar to previous custom chat */
.chat-message {
	max-width: 80%;
}

/* Fine-grained spacing so textarea/control fit naturally */
.chat-inputs {
	gap: 0.25rem;
	align-items: center;
}

.chat-inputs textarea {
	padding: 0.45rem 0.75rem;
	line-height: 1.35;
	min-height: 40px;
	height: 40px;
}

.chat-inputs-controls {
	height: 40px;
	align-items: center;
}

.chat-input-send-button {
	margin: 0;
	width: 40px;
	height: 40px;
}

/* Previous button shadow/ring feel */
.chat-window-wrapper .chat-window-toggle {
	box-shadow:
		0 10px 15px -3px rgb(0 0 0 / 0.1),
		0 4px 6px -4px rgb(0 0 0 / 0.1);
	opacity: 0.9;
	transition: all 0.3s;
}

.chat-window-wrapper .chat-window-toggle:focus-visible {
	box-shadow:
		0 0 0 2px #7bb5cc,
		0 0 0 4px #ffffff,
		0 10px 15px -3px rgb(0 0 0 / 0.1),
		0 4px 6px -4px rgb(0 0 0 / 0.1);
}

html.dark .chat-window-wrapper .chat-window-toggle:focus-visible {
	box-shadow:
		0 0 0 2px #7bb5cc,
		0 0 0 4px #0f172a,
		0 10px 15px -3px rgb(0 0 0 / 0.2),
		0 4px 6px -4px rgb(0 0 0 / 0.2);
}

.portfolio-chat-reset {
	font: inherit;
	font-size: 0.75rem;
	line-height: 1;
	padding: 0.35rem 0.5rem;
	margin-left: auto;
	margin-right: 0.5rem;
	border: 1px solid rgb(255 255 255 / 0.35);
	border-radius: 0.5rem;
	background: transparent;
	color: rgb(255 255 255 / 0.9);
	cursor: pointer;
	transition: background-color 0.2s ease, border-color 0.2s ease;
}

.portfolio-chat-reset:hover {
	background: rgb(255 255 255 / 0.12);
	border-color: rgb(255 255 255 / 0.5);
}
</style>
