<template>
  <div id="top" class="min-h-screen flex flex-col">
    <AppHeader />

    <!-- Main -->
    <main class="flex-1">
      <slot />
    </main>

    <AppFooter />
  </div>
</template>
