<template>
  <header class="shadow-sm bg-white dark:bg-gray-900">
    <nav class="container mx-auto flex justify-between items-center p-4">
      <h1 class="text-xl font-semibold text-primary">Mihail</h1>
      <ul class="flex gap-4">
        <li><RouterLink to="/" class="hover:text-primary">Home</RouterLink></li>
        <li><RouterLink to="/projects" class="hover:text-primary">Projects</RouterLink></li>
        <li><RouterLink to="/about" class="hover:text-primary">About</RouterLink></li>
      </ul>
    </nav>
  </header>
</template>
