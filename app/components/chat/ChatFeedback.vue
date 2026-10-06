<script setup lang="ts">
import { MAX_COMMENT, codePoints } from "~/utils/chat/limits";
import type { Answer } from "~/utils/chat/types";

// Thumbs up or down on one stored answer, and after a thumbs down, an optional
// comment. Each is saved as soon as it is given; a later one replaces it.
const props = defineProps<{ answer: Answer }>();

const chat = useChatConversation();
const sending = ref(false);
const failed = ref(false);
const thanked = ref(false);
const comment = ref("");
const commentId = useId();
const notHelpful = ref<HTMLButtonElement | null>(null);

const commentLength = computed(() => codePoints(comment.value.trim()));
const commentTooLong = computed(() => commentLength.value > MAX_COMMENT);

async function rate(rating: 1 | -1) {
	if (sending.value || props.answer.rating === rating) return;
	sending.value = true;
	failed.value = false;
	thanked.value = false;
	const stored = await chat.rate(props.answer, rating);
	sending.value = false;
	failed.value = !stored;
	thanked.value = stored && rating === 1;
}

async function sendComment() {
	if (sending.value || commentLength.value === 0 || commentTooLong.value) return;
	sending.value = true;
	failed.value = false;
	// The form goes as soon as the comment is on its way, and keyboard focus would
	// fall to the page with its Send button. The thumb it belongs to takes it.
	const saving = chat.rate(props.answer, -1, comment.value);
	nextTick(() => notHelpful.value?.focus());
	const stored = await saving;
	sending.value = false;
	failed.value = !stored;
	if (stored) comment.value = "";
}

const BUTTON_CLASS = "rounded-md p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 aria-disabled:cursor-wait aria-disabled:opacity-60 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100 aria-pressed:text-secondary-800 dark:aria-pressed:text-secondary-300";
</script>

<template>
	<div class="mt-2">
		<div class="flex items-center gap-1">
			<!-- Never disabled while a rating saves, because disabling the focused button
			drops keyboard focus to the page. aria-disabled says the same without that,
			and rate() ignores a press until the save is done. -->
			<button
				type="button"
				:class="BUTTON_CLASS"
				:aria-pressed="answer.rating === 1"
				:aria-disabled="sending || undefined"
				title="Helpful"
				@click="rate(1)"
			>
				<UIcon
					:name="answer.rating === 1 ? 'i-heroicons-hand-thumb-up-solid' : 'i-heroicons-hand-thumb-up'"
					class="h-4 w-4"
					aria-hidden="true"
				/>
				<span class="sr-only">Helpful</span>
			</button>
			<button
				ref="notHelpful"
				type="button"
				:class="BUTTON_CLASS"
				:aria-pressed="answer.rating === -1"
				:aria-disabled="sending || undefined"
				title="Not helpful"
				@click="rate(-1)"
			>
				<UIcon
					:name="answer.rating === -1 ? 'i-heroicons-hand-thumb-down-solid' : 'i-heroicons-hand-thumb-down'"
					class="h-4 w-4"
					aria-hidden="true"
				/>
				<span class="sr-only">Not helpful</span>
			</button>
			<p v-if="thanked || answer.commented" class="ml-1 text-xs text-gray-600 dark:text-gray-300" role="status">
				Thank you for the feedback.
			</p>
		</div>

		<form v-if="answer.rating === -1 && !answer.commented" class="mt-2 space-y-2" @submit.prevent="sendComment">
			<label :for="commentId" class="block text-xs text-gray-600 dark:text-gray-300">
				What was missing or wrong? (optional)
			</label>
			<textarea
				:id="commentId"
				v-model="comment"
				rows="2"
				class="block w-full resize-none rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-secondary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
			/>
			<div class="flex items-center justify-end gap-2">
				<p v-if="commentTooLong" class="text-xs text-red-700 dark:text-red-400">
					A comment can be at most 1,000 characters long.
				</p>
				<button
					type="submit"
					class="rounded-lg bg-secondary-800 px-3 py-1 text-sm text-white hover:bg-secondary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-gray-800"
					:disabled="sending || commentLength === 0 || commentTooLong"
				>
					Send
				</button>
			</div>
		</form>

		<p v-if="failed" class="mt-1 text-xs text-red-700 dark:text-red-400" role="status">
			Your feedback could not be sent. Please try again.
		</p>
	</div>
</template>
