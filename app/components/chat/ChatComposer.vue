<script setup lang="ts">
import { MAX_QUESTION, codePoints } from "~/utils/chat/limits";

// Where a question is written. Typing stays possible while an answer is being
// written; sending waits for it.
const props = defineProps<{ busy: boolean }>();
const emit = defineEmits<{ send: [text: string] }>();

const text = ref("");
const field = ref<HTMLTextAreaElement | null>(null);
const sendButton = ref<HTMLButtonElement | null>(null);
const fieldId = useId();
const counterId = useId();

const length = computed(() => codePoints(text.value.trim()));
const tooLong = computed(() => length.value > MAX_QUESTION);
// The counter appears as a question nears the limit, rather than always.
const showCounter = computed(() => length.value >= MAX_QUESTION - 200);
const canSend = computed(() => !props.busy && length.value > 0 && !tooLong.value);

// How the send button was last pressed: "mouse", "pen" or "touch" from its
// pointerdown, or "keyboard".
let pressedBy = "";

function notePress(how: string) {
	pressedBy = how;
}

function submit() {
	if (!canSend.value) return;
	// Sending empties the field and disables the button, and disabling the button
	// that has focus drops focus to the page. If the button had it, focus goes back to
	// the field, ready for the next question -- unless the button was tapped: on a
	// phone that would open the keyboard over the answer that is about to arrive.
	const refocus = document.activeElement === sendButton.value && pressedBy !== "touch";
	pressedBy = "";
	emit("send", text.value);
	text.value = "";
	nextTick(() => {
		resize();
		if (refocus) field.value?.focus();
	});
}

function onKeydown(event: KeyboardEvent) {
	if (event.key !== "Enter" || event.shiftKey) return;
	// The Enter that picks a word in an input method is not a send. Safari reports
	// that Enter with isComposing false, but with the key code 229.
	if (event.isComposing || event.keyCode === 229) return;
	event.preventDefault();
	submit();
}

// Grows with the question, up to about six lines, then scrolls.
function resize() {
	const element = field.value;
	if (!element) return;
	element.style.height = "auto";
	element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
}

defineExpose({
	focus: () => field.value?.focus(),
});
</script>

<template>
	<form class="flex items-end gap-2" @submit.prevent="submit">
		<label :for="fieldId" class="sr-only">Your question</label>
		<textarea
			:id="fieldId"
			ref="field"
			v-model="text"
			rows="1"
			placeholder="Ask about Mihail's work"
			class="block max-h-40 min-h-10 w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-secondary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
			:aria-describedby="showCounter ? counterId : undefined"
			@keydown="onKeydown"
			@input="resize"
		/>
		<button
			ref="sendButton"
			type="submit"
			@pointerdown="notePress($event.pointerType)"
			@keydown="notePress('keyboard')"
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-800 text-white hover:bg-secondary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-gray-900"
			:disabled="!canSend"
		>
			<UIcon name="i-heroicons-paper-airplane" class="h-5 w-5" aria-hidden="true" />
			<span class="sr-only">Send</span>
		</button>
	</form>
	<p
		v-if="showCounter"
		:id="counterId"
		class="mt-1 text-right text-xs"
		:class="tooLong ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'"
	>
		{{ length.toLocaleString("en-GB") }} / 2,000
	</p>
</template>
