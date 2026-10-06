<script setup lang="ts">
import { plainText } from "~/utils/chat/answerText";

// The chat itself: a native <dialog>, full screen and modal on a phone, a panel in
// the corner beside the page on anything wider. Loaded on the first open, and kept
// mounted after that.

const emit = defineEmits<{
	/** An answer finished, or failed: the launcher marks it if the panel is closed. */
	answered: [];
}>();

const GREETING =
	"Hello, I am Rachel, Mihail's personal AI assistant. I am here to answer any questions you may have about him or his projects to the best of my knowledge. How can I help you?";

const SUGGESTIONS = [
	"What has Mihail built with AI?",
	"Is Mihail available for freelance work?",
	"How was this assistant built?",
];

const { isOpen, isModal, closeChat } = useAiChat();
const chat = useChatConversation();
const { state } = chat;

const dialog = ref<HTMLDialogElement | null>(null);
const list = ref<HTMLElement | null>(null);
const composer = ref<{ focus: () => void } | null>(null);

// Tailwind's `sm:` breakpoint, which the template's layout switches on too.
const WIDE = "(min-width: 40rem)";
let wideQuery: MediaQueryList | null = null;
// Whatever had focus when the panel opened: the launcher, or a project card's
// "Ask the assistant". Focus goes back there when it closes.
let opener: HTMLElement | null = null;

function present() {
	const element = dialog.value;
	if (element === null) return;
	if (element.open) {
		// Already open in the other mode: the screen has crossed the breakpoint.
		element.close();
	} else {
		opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	}

	const modal = !(wideQuery?.matches ?? false);
	if (modal) element.showModal();
	else element.show();
	isModal.value = modal;
	// The page behind a modal dialog is inert, but a phone would still scroll it.
	document.documentElement.style.overflow = modal ? "hidden" : "";

	nextTick(() => {
		scrollToEnd();
		composer.value?.focus();
	});
}

function dismiss() {
	const element = dialog.value;
	if (element?.open) element.close();
	isModal.value = false;
	document.documentElement.style.overflow = "";

	const back = opener;
	opener = null;
	if (back?.isConnected) back.focus();
}

watch(isOpen, (open) => (open ? present() : dismiss()));

function onWideChange() {
	if (dialog.value?.open) present();
}

onMounted(() => {
	wideQuery = window.matchMedia(WIDE);
	wideQuery.addEventListener("change", onWideChange);
	// The click that mounted this panel is the one that opened it.
	if (isOpen.value) present();
});

onBeforeUnmount(() => {
	wideQuery?.removeEventListener("change", onWideChange);
	document.documentElement.style.overflow = "";
});

// Esc closes the panel in both modes; a modal dialog would close itself, but the
// corner panel would not. Not while an input method is composing, where Esc
// cancels the composition instead.
function onKeydown(event: KeyboardEvent) {
	if (event.key !== "Escape" || event.isComposing) return;
	event.preventDefault();
	closeChat();
}

// The browser's own ways of closing a modal dialog, such as the back gesture on
// Android, go through the same state as everything else.
function onCancel(event: Event) {
	event.preventDefault();
	closeChat();
}

function onClose() {
	// `close` arrives after the dialog closed. When the panel was only reopening in
	// the other mode, it is already open again, and nothing needs doing.
	if (isOpen.value && !dialog.value?.open) closeChat();
}

// --- Following the conversation -------------------------------------------------

// Whether the list is scrolled to the bottom. A streaming answer is followed only
// then, so a visitor who scrolls up to read is not pulled back down.
const pinned = ref(true);

function onScroll() {
	const element = list.value;
	if (element) pinned.value = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
}

function scrollToEnd() {
	const element = list.value;
	if (element) element.scrollTop = element.scrollHeight;
}

const progress = computed(() => {
	const last = state.messages.at(-1);
	if (last === undefined) return "";
	return last.role === "user" ? last.id : `${last.id}:${last.status}:${last.text.length}`;
});

watch(progress, () => {
	if (pinned.value) nextTick(scrollToEnd);
});

// One polite announcement at a time: that the knowledge base is being searched, then
// the finished answer once. Not the words as they arrive, which a screen reader
// would read out one by one.
const announcement = ref("");

function announce(text: string) {
	// Emptied first, so that the same words twice are still read out.
	announcement.value = "";
	nextTick(() => {
		announcement.value = text;
	});
}

watch(
	() => {
		const last = state.messages.at(-1);
		return last?.role === "assistant" ? `${last.id}:${last.status}` : "";
	},
	() => {
		const last = state.messages.at(-1);
		if (last?.role !== "assistant") return;
		if (last.status === "searching") {
			announce("Searching the knowledge base");
		} else if (last.status === "done") {
			announce(plainText(last.text));
			emit("answered");
		} else if (last.status === "error") {
			announce(last.error ?? "");
			emit("answered");
		}
	},
);

function ask(text: string) {
	pinned.value = true;
	void chat.send(text);
	nextTick(scrollToEnd);
}

// The kind of pointer that last pressed something in the panel: "mouse", "pen" or
// "touch", from the pointerdown that comes before every click.
let lastPointer = "";

function notePointer(event: PointerEvent) {
	lastPointer = event.pointerType;
}

// A suggested question, or "Try again", disappears as soon as it is pressed, and
// focus would fall to the page with it: a mouse click focuses the button in most
// browsers, and so does the keyboard. Esc, which the panel listens for, would then
// stop closing it. So focus moves to the composer, unless the press was a tap, so
// that a phone does not open its keyboard over the answer. A click with no pointer
// behind it, from the keyboard, has `detail` 0.
function keepFocus(event: MouseEvent) {
	if (event.detail === 0 || lastPointer !== "touch") nextTick(() => composer.value?.focus());
}

function suggest(question: string, event: MouseEvent) {
	ask(question);
	keepFocus(event);
}

function retry(event: MouseEvent) {
	pinned.value = true;
	void chat.retry();
	keepFocus(event);
}

function startOver() {
	chat.reset();
	nextTick(() => composer.value?.focus());
}
</script>

<template>
	<dialog
		ref="dialog"
		aria-labelledby="ai-chat-title"
		class="fixed inset-0 z-50 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-left sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[min(40rem,calc(100dvh-8rem))] sm:w-[25rem]"
		@keydown="onKeydown"
		@cancel="onCancel"
		@close="onClose"
		@pointerdown.capture="notePointer"
	>
		<div
			class="flex h-full w-full flex-col overflow-hidden border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:rounded-2xl sm:border sm:shadow-2xl"
		>
			<header class="flex items-start gap-1 bg-secondary-900 px-4 py-3 text-white dark:bg-secondary-950">
				<div class="min-w-0 flex-1">
					<h2 id="ai-chat-title" class="font-semibold leading-tight">
						Rachel · AI assistant
					</h2>
					<p class="mt-0.5 text-sm text-secondary-100">
						Automated assistant. Answers may not be perfect.
					</p>
				</div>
				<!-- Icons only, each named by a tooltip for the mouse and by its hidden
				label for a screen reader. -->
				<button
					type="button"
					class="flex shrink-0 items-center rounded-lg p-1.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
					title="New conversation"
					:disabled="state.messages.length === 0"
					@click="startOver"
				>
					<UIcon name="i-heroicons-pencil-square" class="h-5 w-5" aria-hidden="true" />
					<span class="sr-only">New conversation</span>
				</button>
				<button
					type="button"
					class="flex shrink-0 items-center rounded-lg p-1.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
					title="Close the chat"
					@click="closeChat()"
				>
					<UIcon name="i-heroicons-x-mark" class="h-5 w-5" aria-hidden="true" />
					<span class="sr-only">Close the chat</span>
				</button>
			</header>

			<div
				ref="list"
				class="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
				@scroll.passive="onScroll"
			>
				<div class="flex justify-start">
					<p class="max-w-[85%] rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2 dark:bg-gray-800">
						{{ GREETING }}
					</p>
				</div>

				<ul v-if="state.messages.length === 0" class="flex flex-col items-start gap-2" aria-label="Suggested questions">
					<li v-for="question in SUGGESTIONS" :key="question">
						<button
							type="button"
							class="rounded-full border border-secondary-300 px-3 py-1.5 text-left text-sm text-secondary-900 hover:bg-secondary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 dark:border-secondary-700 dark:text-secondary-100 dark:hover:bg-secondary-950"
							@click="suggest(question, $event)"
						>
							{{ question }}
						</button>
					</li>
				</ul>

				<ChatMessage
					v-for="(message, index) in state.messages"
					:key="message.id"
					:message="message"
					:last="index === state.messages.length - 1"
					:busy="state.busy"
					@retry="retry"
				/>
			</div>

			<div class="border-t border-gray-200 px-4 pb-4 pt-3 dark:border-gray-700">
				<p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
					Conversations are kept for 90 days to improve the assistant. Please do not share personal details.
				</p>
				<ChatComposer ref="composer" :busy="state.busy" @send="ask" />
			</div>
		</div>
		<p class="sr-only" aria-live="polite">
			{{ announcement }}
		</p>
	</dialog>
</template>
