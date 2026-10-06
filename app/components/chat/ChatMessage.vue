<script setup lang="ts">
import { linkTarget } from "~/utils/chat/links";
import { safeHref } from "~/utils/chat/answerText";
import type { ChatMessage } from "~/utils/chat/types";

const props = defineProps<{
	message: ChatMessage;
	/** Only the last answer can be asked again: an older one would come back out of order. */
	last: boolean;
	busy: boolean;
}>();

const emit = defineEmits<{ retry: [event: MouseEvent] }>();

const router = useRouter();

const writing = computed(
	() =>
		props.message.role === "assistant"
		&& (props.message.status === "pending" || props.message.status === "searching" || props.message.status === "streaming"),
);

const failed = computed(
	() => props.message.role === "assistant" && (props.message.status === "error" || props.message.status === "interrupted"),
);

// The documents an answer drew on, one entry per document. A citation whose page is
// the top of the home page stays as plain text: four articles point there, and a
// link would only scroll the visitor to where the site begins.
const sources = computed(() => {
	if (props.message.role !== "assistant") return [];
	const seen = new Set<string>();
	const entries: { docId: string; title: string; href: string | null }[] = [];
	for (const citation of props.message.citations) {
		if (seen.has(citation.docId)) continue;
		seen.add(citation.docId);
		const href = citation.url === null ? null : safeHref(citation.url);
		const target = href === null ? null : linkTarget(href, (path) => router.resolve(path).matched.length > 0);
		const home = target?.kind === "section" && target.section === "";
		entries.push({ docId: citation.docId, title: citation.title, href: home ? null : href });
	}
	return entries;
});
</script>

<template>
	<div v-if="message.role === 'user'" class="flex justify-end">
		<p class="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-secondary-800 px-4 py-2 text-white">
			{{ message.text }}
		</p>
	</div>

	<div v-else class="flex justify-start">
		<div
			class="max-w-[85%] rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2 dark:bg-gray-800"
			:aria-busy="writing"
		>
			<p v-if="message.status === 'searching' && message.text === ''" class="text-sm italic text-gray-600 dark:text-gray-300">
				Searching the knowledge base
			</p>
			<p v-else-if="message.status === 'pending'" class="flex gap-1 py-2" aria-hidden="true">
				<span class="h-2 w-2 rounded-full bg-gray-400 motion-safe:animate-bounce" />
				<span class="h-2 w-2 rounded-full bg-gray-400 motion-safe:animate-bounce [animation-delay:150ms]" />
				<span class="h-2 w-2 rounded-full bg-gray-400 motion-safe:animate-bounce [animation-delay:300ms]" />
			</p>

			<ChatAnswerText v-if="message.text !== ''" :text="message.text" />

			<template v-if="failed">
				<p class="mt-1 text-sm text-red-700 dark:text-red-400">
					{{ message.status === 'interrupted' ? 'This answer was interrupted.' : message.error }}
				</p>
				<button
					v-if="last && !busy"
					type="button"
					class="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-secondary-300 px-3 py-1 text-sm text-secondary-900 hover:bg-secondary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 dark:border-secondary-700 dark:text-secondary-100 dark:hover:bg-secondary-950"
					@click="emit('retry', $event)"
				>
					<UIcon name="i-heroicons-arrow-path" class="h-4 w-4" aria-hidden="true" />
					Try again
				</button>
			</template>

			<p
				v-if="message.status === 'done' && sources.length > 0"
				class="mt-2 border-t border-gray-200 pt-2 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300"
			>
				<span class="font-medium">Sources:</span>
				<template v-for="(source, index) in sources" :key="source.docId">
					{{ " " }}
					<ChatLink v-if="source.href !== null" :href="source.href">
						{{ source.title }}
					</ChatLink>
					<span v-else>{{ source.title }}</span>
					<span v-if="index < sources.length - 1">,</span>
				</template>
			</p>

			<ChatFeedback v-if="message.status === 'done' && message.messageId !== null" :answer="message" />
		</div>
	</div>
</template>
