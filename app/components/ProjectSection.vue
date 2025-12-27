<script setup lang="ts">
const currentIndex = ref(0);

const { projects } = useProjects();

function nextProject() {
	currentIndex.value = (currentIndex.value + 1) % projects.length;
}

function prevProject() {
	currentIndex.value =
		currentIndex.value === 0 ? projects.length - 1 : currentIndex.value - 1;
}

// onMounted(() => {
// 	const interval = setInterval(() => {
// 		nextProject();
// 	}, 5000);
// 	onUnmounted(() => clearInterval(interval));
// });
</script>

<template>
	<section
		class="bg-white dark:bg-gray-900 min-h-screen flex items-center pt-16 lg:pt-24"
	>
		<div class="w-full max-w-6xl mx-auto">
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
				<!-- Carousel -->
				<div class="overflow-hidden">
					<div
						class="flex transition-transform duration-500 ease-in-out"
						:style="{
							transform: `translateX(-${currentIndex * 100}%)`,
						}"
					>
						<div
							v-for="project in projects"
							:key="project.id"
							class="w-full shrink-0"
						>
							<ProjectCard
								:project="project"
								@prev="prevProject"
								@next="nextProject"
							/>
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
