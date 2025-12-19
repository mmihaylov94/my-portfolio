<script setup lang="ts">
const colorMode = useColorMode();

const themes = [
  { value: "light", label: "Light", icon: "i-heroicons-sun" },
  { value: "dark", label: "Dark", icon: "i-heroicons-moon" },
  { value: "system", label: "Auto", icon: "i-heroicons-computer-desktop" },
];

const currentTheme = computed(() => {
  return colorMode.preference;
});

const currentThemeData = computed(() => {
  return themes.find((t) => t.value === currentTheme.value) ?? themes[0];
});

function cycleTheme() {
  const currentIndex = themes.findIndex((t) => t.value === currentTheme.value);
  const nextIndex = (currentIndex + 1) % themes.length;
  const nextTheme = themes[nextIndex];
  if (nextTheme) {
    colorMode.preference = nextTheme.value;
  }
}
</script>

<template>
  <button
    class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-sm"
    :title="currentThemeData?.label"
    @click="cycleTheme"
  >
    <span class="flex items-center gap-1.5">
      <UIcon :name="currentThemeData?.icon" class="w-4 h-4" />
      <span class="hidden sm:inline">{{ currentThemeData?.label }}</span>
    </span>
  </button>
</template>
