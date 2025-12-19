<script setup lang="ts">
const nav = [
  { label: "Home", to: "#top" },
  { label: "About", to: "#about" },
  { label: "Projects", to: "#projects" },
  { label: "Contact", to: "#contact" },
];

function onNavClick(to: string) {
  if (!to.startsWith("#")) return;

  const el = document.querySelector(to);
  if (!el) return;

  const offsetPosition = el.getBoundingClientRect().top + window.pageYOffset;

  window.scrollTo({
    top: Math.max(0, offsetPosition),
    behavior: "smooth",
  });
  history.replaceState(null, "", to);
}
</script>

<template>
  <!-- Header -->
  <header
    class="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-primary-300/60 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-xl max-w-6xl w-[calc(100%-2rem)]"
  >
    <div class="px-6 py-3 flex items-center justify-between">
      <NuxtLink
        to="/"
        class="font-semibold text-lg text-gray-900 dark:text-gray-100 hover:text-secondary-600 dark:hover:text-secondary-400 transition-colors"
      >
        <div class="flex items-center gap-2.5">
          <img
            src="/favicon.ico"
            alt="Logo"
            class="w-6 h-6 shrink-0 object-contain"
          />
          <span class="whitespace-nowrap">Mihail Mihaylov</span>
        </div>
      </NuxtLink>

      <div class="flex items-center gap-4">
        <nav class="hidden md:flex items-center gap-2">
          <UButton
            v-for="item in nav"
            :key="item.to"
            variant="ghost"
            size="sm"
            class="text-gray-700 dark:text-gray-300 hover:text-secondary-600 dark:hover:text-secondary-400"
            @click="onNavClick(item.to)"
          >
            {{ item.label }}
          </UButton>
        </nav>

        <!-- Theme Toggle -->
        <ThemeToggle />

        <!-- Mobile menu -->
        <div class="md:hidden">
          <UDropdownMenu
            :items="[
              nav.map((i) => ({
                label: i.label,
                click: () => onNavClick(i.to),
              })),
            ]"
          >
            <UButton
              icon="i-heroicons-bars-3"
              variant="ghost"
              class="text-gray-700 dark:text-gray-300"
              aria-label="Open menu"
            />
          </UDropdownMenu>
        </div>
      </div>
    </div>
  </header>
</template>
