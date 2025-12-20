<script setup lang="ts">
interface Project {
	id: string;
	title: string;
	description: string;
	image: string;
	liveUrl?: string;
	githubUrl?: string;
	technologies: string[];
}

interface Props {
	project: Project;
}

defineProps<Props>();
</script>

<template>
	<div
		class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-full flex flex-col"
	>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
			<!-- Image Side -->
			<div class="relative h-72 lg:h-full bg-gray-200 dark:bg-gray-700">
				<img
					:src="project.image"
					:alt="project.title"
					class="w-full h-full object-cover"
				/>
			</div>

			<!-- Content Side -->
			<div class="p-8 lg:p-10 flex flex-col justify-between h-full">
				<div class="space-y-5">
					<!-- Title -->
					<h3
						class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100"
					>
						{{ project.title }}
					</h3>

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
						v-if="project.liveUrl"
						variant="subtle"
						size="md"
						:href="project.liveUrl"
						target="_blank"
						rel="noopener noreferrer"
						class="flex-1"
					>
						Visit Project
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
