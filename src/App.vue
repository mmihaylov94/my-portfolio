<template>
  <!-- Tailwind dark mode uses 'class' strategy; parent can get 'dark' later -->
  <div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <HeaderBar />

    <main class="container mx-auto p-6">
      <RouterView />
    </main>

    <FooterBar />

    <!-- Global PrimeVue services -->
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'

// your header and footer from earlier
import HeaderBar from './components/HeaderBar.vue'
import FooterBar from './components/FooterBar.vue'

// PrimeVue service components (optional but useful)
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
</script>
