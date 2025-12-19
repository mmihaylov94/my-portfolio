<script setup lang="ts">
const currentIndex = ref(0);

const projects = [
  {
    id: "1",
    title: "E-Commerce Platform",
    description:
      "A full-stack e-commerce solution built with modern web technologies. Features include user authentication, product catalog, shopping cart, payment integration, and admin dashboard.",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/example/ecommerce",
    technologies: ["React", "Node.js", "MongoDB", "TypeScript", "Tailwind CSS"],
  },
  {
    id: "2",
    title: "Task Management App",
    description:
      "A collaborative task management application with real-time updates, drag-and-drop functionality, and team collaboration features. Built with Vue.js and Firebase.",
    image:
      "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/example/taskmanager",
    technologies: ["Vue.js", "Firebase", "JavaScript", "CSS3"],
  },
  {
    id: "3",
    title: "Weather Dashboard",
    description:
      "A beautiful weather dashboard that displays current conditions and forecasts. Features location-based weather, interactive maps, and detailed meteorological data visualization.",
    image:
      "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&h=600&fit=crop",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/example/weather",
    technologies: ["React", "API Integration", "Chart.js", "CSS3"],
  },
  {
    id: "4",
    title: "Social Media Analytics",
    description:
      "An analytics platform for tracking social media performance. Provides insights, engagement metrics, and data visualization for multiple social platforms.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/example/analytics",
    technologies: ["Python", "Django", "PostgreSQL", "D3.js", "REST API"],
  },
  {
    id: "5",
    title: "Portfolio Website",
    description:
      "A responsive portfolio website showcasing projects and skills. Built with modern web technologies and featuring smooth animations and dark mode support.",
    image:
      "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/example/portfolio",
    technologies: ["Nuxt.js", "Vue.js", "TypeScript", "Tailwind CSS"],
  },
];

function nextProject() {
  currentIndex.value = (currentIndex.value + 1) % projects.length;
}

function prevProject() {
  currentIndex.value =
    currentIndex.value === 0 ? projects.length - 1 : currentIndex.value - 1;
}

// Auto-advance carousel (optional)
// onMounted(() => {
//   const interval = setInterval(() => {
//     nextProject();
//   }, 5000);
//   onUnmounted(() => clearInterval(interval));
// });
</script>

<template>
  <section
    class="bg-white dark:bg-gray-900 min-h-screen flex items-center pt-16 lg:pt-24"
  >
    <div class="w-full px-4 sm:px-6 lg:px-16 xl:px-24 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h2
          class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4"
        >
          My Projects
        </h2>
        <p
          class="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
        >
          A collection of projects I've built, showcasing my skills and
          experience in full-stack development and automation.
        </p>
      </div>

      <!-- Carousel Container -->
      <div class="relative">
        <!-- Navigation Buttons -->
        <button
          @click="prevProject"
          class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-secondary-600 dark:hover:text-secondary-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
          aria-label="Previous project"
        >
          <UIcon
            name="i-heroicons-chevron-left"
            class="w-6 h-6 lg:w-7 lg:h-7"
          />
        </button>

        <button
          @click="nextProject"
          class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-secondary-600 dark:hover:text-secondary-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
          aria-label="Next project"
        >
          <UIcon
            name="i-heroicons-chevron-right"
            class="w-6 h-6 lg:w-7 lg:h-7"
          />
        </button>

        <!-- Carousel -->
        <div class="overflow-hidden mx-8 lg:mx-16">
          <div
            class="flex transition-transform duration-500 ease-in-out"
            :style="{
              transform: `translateX(-${currentIndex * 100}%)`,
            }"
          >
            <div
              v-for="project in projects"
              :key="project.id"
              class="w-full shrink-0 px-2"
            >
              <ProjectCard :project="project" />
            </div>
          </div>
        </div>

        <!-- Carousel Indicators -->
        <div class="flex justify-center gap-2 mt-8">
          <button
            v-for="(project, index) in projects"
            :key="project.id"
            @click="currentIndex = index"
            :class="[
              'w-2 h-2 rounded-full transition-all duration-300',
              currentIndex === index
                ? 'bg-secondary-500 w-8'
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500',
            ]"
            :aria-label="`Go to project ${index + 1}`"
          />
        </div>
      </div>
      <SectionDivider />
    </div>
  </section>
</template>
