<script setup lang="ts">
import { toBlocks } from "~/utils/chat/answerText";

// An answer, rendered from tokens rather than HTML: the text is never parsed by the
// browser as markup, so nothing in it can become an element it was not meant to be.
const props = defineProps<{ text: string }>();

const blocks = computed(() => toBlocks(props.text));
</script>

<template>
	<div class="space-y-2 break-words">
		<template v-for="(block, index) in blocks" :key="index">
			<p v-if="block.kind === 'paragraph'">
				<template v-for="(line, number) in block.lines" :key="number">
					<br v-if="number > 0">
					<ChatInline :nodes="line" />
				</template>
			</p>
			<ol v-else-if="block.ordered" :start="block.start" class="list-decimal space-y-1 pl-5">
				<li v-for="(item, number) in block.items" :key="number">
					<ChatInline :nodes="item" />
				</li>
			</ol>
			<ul v-else class="list-disc space-y-1 pl-5">
				<li v-for="(item, number) in block.items" :key="number">
					<ChatInline :nodes="item" />
				</li>
			</ul>
		</template>
	</div>
</template>
