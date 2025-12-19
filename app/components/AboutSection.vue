<script setup lang="ts">
function scrollToSection(id: string) {
  const el = document.querySelector(id);
  if (!el) return;

  // Get the header element to calculate its actual height
  const header = document.querySelector("header");
  const headerHeight = header ? header.offsetHeight : 0;
  const headerTop = header ? parseFloat(getComputedStyle(header).top) || 0 : 0;

  // Account for fixed header position (top offset) + header height + extra padding
  const headerOffset = headerTop + headerHeight + 20;

  const elementPosition = el.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

  window.scrollTo({
    top: Math.max(0, offsetPosition),
    behavior: "smooth",
  });
}

const skills = [
  { label: "PHP", icon: "i-simple-icons-php" },
  { label: "CodeIgniter", icon: "i-simple-icons-codeigniter" },
  { label: "Laravel", icon: "i-simple-icons-laravel" },
  { label: "HTML", icon: "i-simple-icons-html5" },
  { label: "CSS", icon: "i-simple-icons-css3" },
  { label: "JavaScript", icon: "i-simple-icons-javascript" },
  { label: "React", icon: "i-simple-icons-react" },
  { label: "Node", icon: "i-simple-icons-nodedotjs" },
  { label: "Vue.js", icon: "i-simple-icons-vuedotjs" },
  { label: "Nuxt", icon: "i-simple-icons-nuxtdotjs" },
  { label: "Tailwind", icon: "i-simple-icons-tailwindcss" },
  { label: "Firebase", icon: "i-simple-icons-firebase" },
  { label: "Supabase", icon: "i-simple-icons-supabase" },
  { label: "Git", icon: "i-simple-icons-git" },
  { label: "GitHub", icon: "i-simple-icons-github" },
  { label: "SQL", icon: "i-heroicons-circle-stack" },
  { label: "MySQL", icon: "i-simple-icons-mysql" },
  { label: "MariaDB", icon: "i-simple-icons-mariadb" },
  { label: "PostgreSQL", icon: "i-simple-icons-postgresql" },
  { label: "n8n", icon: "i-simple-icons-n8n" },
  { label: "MS Power Automate" },
  { label: "Zapier", icon: "i-simple-icons-zapier" },
  { label: "Make.com", icon: "i-simple-icons-make" },
];

const timeline = [
  {
    title: "Solution Architect",
    company: "Businessmap LTD, Sofia, BG",
    period: "2022 - Current",
    description: "Full-stack developer and automation engineer",
  },
  {
    title: "Technical Solution Architect",
    company: "Deloitte LLP UK, Glasgow, UK",
    period: "2020 - 2022",
    description:
      "Supervised and guided developers through building and testing phases. Contributed to full development lifecycle of RPA projects, from proposal and requirements gathering to deployment. Won four new projects by introducing Microsoft Power Stack. Saved client 10,000+ hours and £250,000 annually through effective document processing automation.",
  },
  {
    title: "MSc Advanced Computer Science",
    company: "University of Strathclyde, Glasgow, UK",
    period: "2018 - 2019",
    description:
      "Master's Dissertation: Predicting the Resolution Time and Priority of Bug Reports: A Deep Learning Approach",
  },
  {
    title: "BEng (Hons) Computer and Electronic Systems",
    company: "University of Strathclyde, Glasgow, UK",
    period: "2013 - 2017",
    description:
      "4th Year Project: Developing a Computer-Based Version of the Board Game Vector Racer using Java (Merit)",
  },
];
</script>

<template>
  <section class="bg-white dark:bg-gray-900 pt-16 lg:pt-24">
    <div
      class="w-full px-4 sm:px-6 lg:px-16 xl:px-24 max-w-7xl mx-auto space-y-16"
    >
      <!-- Top Section: About Me and Profile Picture -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <!-- Right Section: Profile Picture (Circular) - First on mobile -->
        <div
          class="flex items-center justify-center order-1 lg:order-2 lg:justify-end"
        >
          <div class="w-full max-w-md lg:max-w-lg">
            <div
              class="aspect-square rounded-full overflow-hidden shadow-2xl border-8 border-primary-100 dark:border-primary-900"
            >
              <img
                src="/profile_picture.jpg"
                alt="Mihail Mihaylov"
                class="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <!-- Left Section: About Me -->
        <div class="space-y-6 order-2 lg:order-1">
          <div class="space-y-4">
            <h2
              class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100"
            >
              About Me
            </h2>
            <p
              class="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed"
            >
              I build scalable applications and automate business processes.
              With six years of professional experience across Deloitte and
              fast-growing startups, I transform ideas into working solutions
              that matter.
            </p>
            <p
              class="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed"
            >
              Exceptionally talented IT professional with hands-on experience in
              developing and supporting high-tech business/software/RPA
              solutions. Passionate about becoming a full-stack software
              engineer specialising in C#, Python, and Java. Track record of
              success managing teams, engineering projects, and deadlines, with
              expertise in object-oriented software development lifecycle,
              maintenance, testing, and troubleshooting.
            </p>
          </div>

          <!-- Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 pt-4">
            <AppButton
              variant="full"
              size="lg"
              @click="scrollToSection('#projects')"
            >
              View work
            </AppButton>
            <AppButton
              variant="outline"
              size="lg"
              @click="scrollToSection('#contact')"
            >
              Contact me
            </AppButton>
          </div>
        </div>
      </div>

      <!-- Skills Section (Full Width, Centered) -->
      <div class="flex justify-center">
        <div class="w-full max-w-4xl">
          <h3
            class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center"
          >
            Skills & Technologies
          </h3>
          <div class="flex flex-wrap gap-4 justify-center">
            <SkillBadge
              v-for="skill in skills"
              :key="skill.label"
              :label="skill.label"
              :icon="skill.icon"
              variant="large-outline"
            />
          </div>
        </div>
      </div>

      <!-- Bottom Section: Timeline (Centered) -->
      <div class="flex justify-center">
        <div class="w-full max-w-3xl">
          <h3
            class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center"
          >
            Experience & Education
          </h3>
          <div class="space-y-6 relative">
            <!-- Timeline line -->
            <div
              class="absolute left-4 top-0 w-0.5 bg-gray-300 dark:bg-gray-700 hidden lg:block"
              style="height: calc(100% - 2rem)"
            ></div>

            <div
              v-for="(item, index) in timeline"
              :key="index"
              class="relative pl-12 lg:pl-16"
            >
              <!-- Timeline dot -->
              <div
                class="absolute left-0 top-2 w-8 h-8 rounded-full bg-secondary-500 border-4 border-white dark:border-gray-900 shadow-lg hidden lg:flex items-center justify-center z-10"
              >
                <div class="w-2 h-2 rounded-full bg-white"></div>
              </div>

              <div class="space-y-2">
                <div
                  class="flex flex-col sm:flex-row sm:items-baseline sm:gap-2"
                >
                  <h4
                    class="text-xl font-bold text-gray-900 dark:text-gray-100"
                  >
                    {{ item.title }}
                  </h4>
                  <span
                    class="text-sm font-medium text-secondary-600 dark:text-secondary-400 whitespace-nowrap"
                  >
                    {{ item.period }}
                  </span>
                </div>
                <p class="text-gray-600 dark:text-gray-400 font-medium">
                  {{ item.company }}
                </p>
                <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {{ item.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <SectionDivider />
  </section>
</template>
