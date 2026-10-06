<script setup lang="ts">
import type { Inline } from "~/utils/chat/answerText";

// A run of inline tokens. It renders strong and emphasised text by rendering itself
// for what is inside them; a component can use itself by its own file name.
defineProps<{ nodes: Inline[] }>();
</script>

<template>
	<template v-for="(node, index) in nodes" :key="index">
		<template v-if="node.kind === 'text'">
			{{ node.text }}
		</template>
		<ChatLink v-else-if="node.kind === 'link'" :href="node.href">
			{{ node.label }}
		</ChatLink>
		<strong v-else-if="node.kind === 'strong'" class="font-semibold"><ChatInline :nodes="node.children" /></strong>
		<em v-else><ChatInline :nodes="node.children" /></em>
	</template>
</template>
