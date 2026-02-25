<script setup lang="ts">
interface Props {
	label: string;
	icon?: string;
	variant?: "small-filled" | "large-outline";
}

const props = withDefaults(defineProps<Props>(), {
	variant: "small-filled",
});
</script>

<template>
	<span
		:class="[
			'inline-flex items-center rounded-full transition-all duration-200',
			// Small filled variant (default)
			props.variant === 'small-filled'
				? 'gap-1.5 px-3 py-1 text-sm font-medium bg-primary-100 dark:bg-primary-800/30 text-primary-800 dark:text-primary-200 border border-primary-200 dark:border-primary-700/50'
				: '',
			// Large outline variant
			props.variant === 'large-outline'
				? 'gap-2 px-4 py-2 text-base font-semibold bg-transparent border-2 border-secondary-500 dark:border-secondary-400 text-secondary-600 dark:text-secondary-400 shadow-md hover:shadow-lg hover:bg-secondary-50 dark:hover:bg-secondary-950/20 hover:scale-105'
				: '',
		]"
	>
		<img
			v-if="icon && icon.startsWith('/')"
			:src="icon"
			:alt="label"
			:class="props.variant === 'small-filled' ? 'w-4 h-4 shrink-0' : 'w-5 h-5 shrink-0'"
		/>
		<UIcon
			v-else-if="icon"
			:name="icon"
			:class="props.variant === 'small-filled' ? 'w-4 h-4' : 'w-5 h-5'"
		/>
		{{ label }}
	</span>
</template>
