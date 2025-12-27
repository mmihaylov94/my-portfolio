<script setup lang="ts">
const currentYear = new Date().getFullYear();
const { socialLinks } = useAbout();
</script>

<template>
	<footer
		class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
	>
		<div class="w-full px-4 sm:px-6 lg:px-16 xl:px-24 max-w-7xl mx-auto py-8">
			<div
				class="flex flex-col md:flex-row gap-6 md:items-center md:justify-between"
			>
				<!-- Copyright -->
				<div
					class="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left"
				>
					© {{ currentYear }} Mihail Mihaylov. All rights reserved.
				</div>

				<!-- Social Links -->
				<div class="flex items-center justify-center md:justify-end gap-4">
					<a
						v-for="link in socialLinks"
						:key="link.name"
						:href="link.url"
						:aria-label="link.name"
						target="_blank"
						rel="noopener noreferrer"
						class="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-secondary-500 hover:text-white dark:hover:bg-secondary-500 dark:hover:text-white transition-all duration-200"
					>
						<UIcon :name="link.icon" class="w-5 h-5" />
					</a>
				</div>
			</div>
		</div>
	</footer>
</template>
