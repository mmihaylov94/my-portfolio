<script setup lang="ts">
import type { Project } from "~/composables/useProjects";

interface Props {
	project: Project;
}

defineProps<Props>();

const emit = defineEmits<{
	prev: [];
	next: [];
}>();
</script>

<template>
	<div
		class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-full flex flex-col w-full"
	>
		<!-- Navigation Buttons -->
		<button
			@click="emit('prev')"
			class="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex items-center justify-center text-gray-500 dark:text-gray-400 opacity-70 hover:opacity-100 hover:text-secondary-700 dark:hover:text-secondary-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all duration-300"
			aria-label="Previous project"
		>
			<UIcon name="i-heroicons-chevron-left" class="w-5 h-5 lg:w-6 lg:h-6" />
		</button>

		<button
			@click="emit('next')"
			class="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex items-center justify-center text-gray-500 dark:text-gray-400 opacity-70 hover:opacity-100 hover:text-secondary-700 dark:hover:text-secondary-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all duration-300"
			aria-label="Next project"
		>
			<UIcon name="i-heroicons-chevron-right" class="w-5 h-5 lg:w-6 lg:h-6" />
		</button>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
			<!-- Image Side -->
			<div
				class="relative h-72 lg:h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-4 lg:p-6"
			>
				<img
					:src="project.image"
					:alt="project.title"
					class="max-w-full max-h-full w-auto h-auto object-contain"
				/>
			</div>

			<!-- Content Side -->
			<div
				class="p-8 lg:p-10 pr-16 lg:pr-20 flex flex-col justify-between h-full"
			>
				<div class="space-y-5">
					<!-- Title -->
					<h3
						class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100"
					>
						{{ project.title }}
					</h3>

					<!-- Outcome -->
					<p
						v-if="project.outcome"
						class="text-sm font-medium text-secondary-700 dark:text-secondary-300"
					>
						{{ project.outcome }}
					</p>

					<!-- Description -->
					<p class="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
						{{ project.description }}
					</p>

					<!-- Skill Badges -->
					<div class="flex flex-wrap gap-2 pt-2">
						<SkillBadge
							v-for="tech in project.technologies"
							:key="tech"
							:label="tech"
						/>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="flex flex-col sm:flex-row gap-3 pt-8">
					<AppButton
						v-if="project.liveUrl || project.liveDisabled"
						variant="subtle"
						size="md"
						:href="project.liveDisabled ? undefined : project.liveUrl"
						:target="project.liveDisabled ? undefined : '_blank'"
						:rel="project.liveDisabled ? undefined : 'noopener noreferrer'"
						:disabled="project.liveDisabled"
						class="flex-1"
					>
						{{ project.liveLabel || "Visit Project" }}
					</AppButton>
					<AppButton
						v-if="project.githubUrl"
						variant="subtle-outline"
						size="md"
						:href="project.githubUrl"
						target="_blank"
						rel="noopener noreferrer"
						class="flex-1"
					>
						View on GitHub
					</AppButton>
				</div>
			</div>
		</div>
	</div>
</template>
