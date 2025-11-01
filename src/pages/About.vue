<template>
  <DefaultLayout>
    <section class="text-center py-20">
      <h1 class="text-4xl font-bold mb-4">Hi, I'm Mihail</h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        I am a full-stack developer and automation engineer
      </p>
      <div class="mt-8">
        <Button label="View Projects" @click="$router.push('/projects')" />
      </div>
    </section>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from '../layouts/DefaultLayout.vue'
import Button from 'primevue/button'
</script>
