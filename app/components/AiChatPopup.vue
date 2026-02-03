<script setup lang="ts">
interface ChatMessage {
	id?: string
	role: "user" | "assistant"
	content: string
};

const isComingSoon = true;
const isOpen = ref(false);
const messages = ref<ChatMessage[]>([]);
const input = ref("");
const isLoading = ref(false);
const feedbackGiven = ref<Record<string, "positive" | "negative">>({});

function toggle() {
	if (isComingSoon) return;
	isOpen.value = !isOpen.value;
}

async function sendMessage() {
	const text = input.value.trim();
	if (!text || isLoading.value) return;

	const userMsg: ChatMessage = { role: "user", content: text };
	messages.value.push(userMsg);
	input.value = "";
	isLoading.value = true;

	try {
		const history = messages.value
			.slice(0, -1)
			.map((m) => ({ role: m.role, content: m.content }));

		const response = await fetch("/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ message: text, history })
		});

		const data = (await response.json()) as { reply?: string; error?: string };
		const reply = data?.reply ?? data?.error ?? "Sorry, I couldn't process that.";

		const assistantMsg: ChatMessage = {
			id: `a-${Date.now()}`,
			role: "assistant",
			content: reply
		};
		messages.value.push(assistantMsg);
	} catch (err) {
		console.error("Chat error:", err);
		messages.value.push({
			id: `a-${Date.now()}`,
			role: "assistant",
			content: "Something went wrong. Please try again."
		});
	} finally {
		isLoading.value = false;
	}
}

async function sendFeedback(
	messageId: string,
	feedback: "positive" | "negative",
	chatMessage: string,
	reply: string
) {
	if (feedbackGiven.value[messageId]) return;
	feedbackGiven.value[messageId] = feedback;

	try {
		await fetch("api/feedback", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				messageId,
				feedback,
				chatMessage,
				reply
			})
		});
	} catch (err) {
		console.error("Feedback error:", err);
	}
}
</script>

<template>
	<div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
		<!-- Panel (hidden when coming soon) -->
		<Transition
			v-if="!isComingSoon"
			enter-active-class="transition ease-out duration-200"
			enter-from-class="opacity-0 translate-y-4 scale-95"
			enter-to-class="opacity-100 translate-y-0 scale-100"
			leave-active-class="transition ease-in duration-150"
			leave-from-class="opacity-100 translate-y-0 scale-100"
			leave-to-class="opacity-0 translate-y-4 scale-95"
		>
			<div
				v-show="isOpen"
				class="w-84 min-w-84 max-w-[calc(100vw-2rem)] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex flex-col transition-all duration-300"
			>
				<!-- Header -->
				<div
					class="flex items-center justify-between px-5 py-4 bg-secondary-500 text-white"
				>
					<h3
						class="font-semibold text-base"
					>
						Chat with me
					</h3>
					<button
						type="button"
						aria-label="Close chat"
						class="p-1 rounded-md hover:bg-secondary-600 transition-colors"
						@click="toggle"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</div>

				<!-- Messages -->
				<div
					class="flex-1 min-h-[280px] max-h-[420px] overflow-y-auto p-5 space-y-4 bg-primary-50 dark:bg-gray-900"
				>
					<div
						v-if="messages.length === 0"
						class="text-base text-gray-600 dark:text-gray-400 text-center py-12"
					>
						Ask me anything about my work or projects.
					</div>
					<div
						v-for="msg in messages"
						:key="msg.id ?? msg.content"
						:class="[
							'flex',
							msg.role === 'user' ? 'justify-end' : 'justify-start'
						]"
					>
						<div
							:class="[
								'max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed',
								msg.role === 'user'
									? 'bg-secondary-500 text-white rounded-br-md'
									: 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow border border-gray-200 dark:border-gray-600 rounded-bl-md'
							]"
						>
							<p
								class="whitespace-pre-wrap"
							>
								{{ msg.content }}
							</p>
							<!-- Feedback for assistant messages -->
							<div
								v-if="msg.role === 'assistant' && msg.id"
								class="flex items-center gap-1 mt-2"
							>
								<button
									type="button"
									:aria-label="feedbackGiven[msg.id] === 'positive' ? 'Positive feedback sent' : 'Thumbs up'"
									:disabled="!!feedbackGiven[msg.id]"
									:class="[
										'p-1 rounded transition-colors',
										feedbackGiven[msg.id] === 'positive'
											? 'text-green-600 dark:text-green-400'
											: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
									]"
									@click="
										sendFeedback(
											msg.id!,
											'positive',
											messages[messages.findIndex((m) => m.id === msg.id) - 1]?.content ?? '',
											msg.content
										)
									"
								>
									<UIcon
										name="i-heroicons-hand-thumb-up"
										class="h-4 w-4"
									/>
								</button>
								<button
									type="button"
									:aria-label="feedbackGiven[msg.id] === 'negative' ? 'Negative feedback sent' : 'Thumbs down'"
									:disabled="!!feedbackGiven[msg.id]"
									:class="[
										'p-1 rounded transition-colors',
										feedbackGiven[msg.id] === 'negative'
											? 'text-red-600 dark:text-red-400'
											: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
									]"
									@click="
										sendFeedback(
											msg.id!,
											'negative',
											messages[messages.findIndex((m) => m.id === msg.id) - 1]?.content ?? '',
											msg.content
										)
									"
								>
									<UIcon
										name="i-heroicons-hand-thumb-down"
										class="h-4 w-4"
									/>
								</button>
							</div>
						</div>
					</div>
					<div
						v-if="isLoading"
						class="flex justify-start"
					>
						<div
							class="bg-white dark:bg-gray-700 rounded-xl rounded-bl-md px-4 py-2.5 shadow border border-gray-200 dark:border-gray-600"
						>
							<span class="inline-flex gap-1">
								<span
									class="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
									style="animation-delay: 0ms"
								/>
								<span
									class="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
									style="animation-delay: 150ms"
								/>
								<span
									class="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
									style="animation-delay: 300ms"
								/>
							</span>
						</div>
					</div>
				</div>

				<!-- Input -->
				<form
					class="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
					@submit.prevent="sendMessage"
				>
					<div class="flex gap-3">
						<input
							v-model="input"
							type="text"
							placeholder="Type a message..."
							:disabled="isLoading"
							class="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent text-sm disabled:opacity-50"
						/>
						<AppButton
							type="submit"
							variant="full"
							size="md"
							:disabled="!input.trim() || isLoading"
							class="shrink-0"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
								/>
							</svg>
						</AppButton>
					</div>
				</form>
			</div>
		</Transition>

		<!-- Trigger button -->
		<button
			type="button"
			:title="isComingSoon ? 'Coming soon...' : (isOpen ? 'Close chat' : 'Open chat')"
			:aria-label="isComingSoon ? 'Coming soon...' : (isOpen ? 'Close chat' : 'Open chat')"
			:class="[
				'flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
				isComingSoon
					? 'bg-secondary-400 dark:bg-secondary-600 text-white/90 cursor-not-allowed opacity-90'
					: 'bg-secondary-500 text-white hover:bg-secondary-600 hover:shadow-xl hover:-translate-y-0.5'
			]"
			:disabled="isComingSoon"
			@click="toggle"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
				/>
			</svg>
		</button>
	</div>
</template>
