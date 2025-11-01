<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
    <main class="flex-1 container mx-auto p-6">
      <slot />
    </main>
  </div>
</template>

<script setup>
import HeaderBar from '../components/HeaderBar.vue'
import FooterBar from '../components/FooterBar.vue'
</script>
