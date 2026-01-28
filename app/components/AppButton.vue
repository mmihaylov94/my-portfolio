<script setup lang="ts">
interface Props {
	variant?: "full" | "outline" | "subtle" | "subtle-outline";
	size?: "sm" | "md" | "lg";
	to?: string;
	href?: string;
	type?: "button" | "submit" | "reset";
	disabled?: boolean;
	class?: string;
}

const props = withDefaults(defineProps<Props>(), {
	variant: "full",
	size: "md",
	type: "button",
	disabled: false,
	class: "",
});

const emit = defineEmits<{
	click: [];
}>();

function handleClick() {
	emit("click");
}

function getComponentType() {
	if (props.to) return "NuxtLink";
	if (props.href) {
		// Use regular <a> tag for external URLs
		return props.href.startsWith("http") ? "a" : "NuxtLink";
	}
	return "button";
}
</script>

<template>
	<component
		:is="getComponentType()"
		:to="props.to"
		:href="getComponentType() === 'a' ? props.href : undefined"
		:type="getComponentType() === 'button' ? type : undefined"
		:disabled="disabled"
		:target="props.href && props.href.startsWith('http') ? '_blank' : undefined"
		:rel="props.href && props.href.startsWith('http') ? 'noopener noreferrer' : undefined"
		:class="[
			'inline-flex items-center justify-center font-medium transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
			{
				// Full variant
				'bg-secondary-500 text-white hover:bg-secondary-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 focus:ring-secondary-500':
					variant === 'full',
				// Outline variant
				'bg-transparent border-2 border-secondary-500 dark:border-secondary-400 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-950/20 hover:border-secondary-600 dark:hover:border-secondary-500 hover:shadow-md active:bg-secondary-100 dark:active:bg-secondary-950/30 focus:ring-secondary-500':
					variant === 'outline',
				// Subtle variant (matches project card style)
				'bg-primary-100 dark:bg-primary-800/30 text-primary-800 dark:text-primary-200 border border-primary-200 dark:border-primary-700/50 hover:bg-primary-200 dark:hover:bg-primary-800/50 hover:border-primary-300 dark:hover:border-primary-600/50 active:bg-primary-300 dark:active:bg-primary-800/70 focus:ring-primary-500':
					variant === 'subtle',
				// Subtle outline variant (primary colors with outline)
				'bg-transparent border-2 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-600 dark:hover:border-primary-500 hover:shadow-sm active:bg-primary-100 dark:active:bg-primary-900/30 focus:ring-primary-500':
					variant === 'subtle-outline',
				// Sizes
				'px-3 py-1.5 text-xs rounded-md': size === 'sm',
				'px-5 py-2.5 text-sm rounded-lg': size === 'md',
				'px-6 py-3 text-base rounded-xl': size === 'lg',
			},
			props.class,
		]"
		@click="handleClick"
	>
		<slot />
	</component>
</template>
