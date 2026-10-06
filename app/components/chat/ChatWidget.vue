<script setup lang="ts">
// The chat's launcher, on every page. It is prerendered as a plain button; the
// panel, and everything the chat needs, loads the first time someone opens it.
const { isOpen, openChat, closeChat } = useAiChat();

// Once opened, the panel stays mounted, so an answer keeps arriving while it is
// closed, and so does its place in the conversation.
const mounted = ref(false);
// An answer finished while the panel was closed.
const unread = ref(false);

watch(
	isOpen,
	(open) => {
		if (!open) return;
		mounted.value = true;
		unread.value = false;
	},
	{ immediate: true },
);

onMounted(() => {
	// The old chat widget's session id. Nothing reads it any more.
	try {
		window.localStorage.removeItem("n8n-chat/sessionId");
	} catch {
		// Storage is blocked; there is nothing to remove.
	}
});

function toggle() {
	if (isOpen.value) closeChat();
	else openChat();
}

function answered() {
	if (!isOpen.value) unread.value = true;
}
</script>

<template>
	<button
		type="button"
		class="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-800 text-white shadow-lg hover:bg-secondary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 motion-safe:transition-colors"
		aria-haspopup="dialog"
		:aria-expanded="isOpen"
		@click="toggle"
	>
		<UIcon name="i-heroicons-chat-bubble-left-right" class="h-7 w-7" aria-hidden="true" />
		<span class="sr-only">Chat with Rachel, the AI assistant</span>
		<template v-if="unread">
			<span
				class="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-primary-400 ring-2 ring-white dark:ring-gray-900"
				aria-hidden="true"
			/>
			<span class="sr-only">(a new reply)</span>
		</template>
	</button>
	<LazyChatPanel v-if="mounted" @answered="answered" />
</template>
