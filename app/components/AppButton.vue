<script setup lang="ts">
interface Props {
  variant?: "full" | "outline";
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
</script>

<template>
  <component
    :is="to || href ? 'NuxtLink' : 'button'"
    :to="to"
    :href="href"
    :type="to || href ? undefined : type"
    :disabled="disabled"
    :class="[
      'inline-flex items-center justify-center font-medium transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      {
        // Full variant
        'bg-secondary-500 text-white hover:bg-secondary-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 focus:ring-secondary-500':
          variant === 'full',
        // Outline variant
        'bg-transparent border-2 border-secondary-500 dark:border-secondary-400 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-950/20 hover:border-secondary-600 dark:hover:border-secondary-500 hover:shadow-md active:bg-secondary-100 dark:active:bg-secondary-950/30 focus:ring-secondary-500':
          variant === 'outline',
        // Sizes
        'px-4 py-2 text-sm rounded-md': size === 'sm',
        'px-6 py-3 text-base rounded-lg': size === 'md',
        'px-8 py-4 text-lg rounded-xl': size === 'lg',
      },
      props.class,
    ]"
    @click="handleClick"
  >
    <slot />
  </component>
</template>
