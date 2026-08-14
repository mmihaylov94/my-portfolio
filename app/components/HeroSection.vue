<script setup lang="ts">
const { scrollToSection } = useNavigation();
</script>

<template>
	<section
		class="min-h-screen flex items-center justify-center py-28 sm:py-32 bg-[linear-gradient(to_bottom_right,var(--color-primary-200)_0%,var(--color-primary-200)_40%,var(--color-secondary-200)_60%,var(--color-secondary-200)_100%)] dark:bg-[linear-gradient(to_bottom_right,var(--color-gray-900)_0%,var(--color-gray-900)_40%,var(--color-gray-800)_60%,var(--color-gray-800)_100%)] relative"
	>
		<div class="text-center px-8 max-w-4xl mx-auto">
			<h1
				class="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-6"
			>
				Mihail Mihaylov
			</h1>
			<p
				class="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-snug mb-6"
			>
				Solutions Architect — automation, integrations, and AI systems that hold
				up in production
			</p>
			<p
				class="text-base md:text-lg lg:text-xl text-gray-700 dark:text-gray-300 leading-relaxed"
			>
				I help organisations reduce manual work, connect fragmented tools, and
				turn complex operational processes into reliable software. Six years
				across enterprise RPA delivery at Deloitte and solution architecture at a
				SaaS company, plus products I design, build, deploy and operate on my own
				infrastructure. My strength is choosing the right technical approach for
				the problem, not forcing every solution into the same stack.
			</p>

			<!-- Calls to action -->
			<div class="flex flex-col sm:flex-row gap-4 justify-center pt-8">
				<AppButton variant="full" size="lg" @click="scrollToSection('projects')">
					View work
				</AppButton>
				<AppButton
					variant="outline"
					size="lg"
					href="/Mihail_Mihaylov_CV.pdf"
					download
				>
					Download CV
				</AppButton>
			</div>
		</div>
		<!-- Section Divider -->
		<div class="absolute bottom-0 left-0 right-0 flex justify-center pb-8">
			<div
				class="w-24 h-1 bg-linear-to-r from-transparent via-primary-400 to-transparent dark:via-gray-600 rounded-full"
			></div>
		</div>
	</section>
</template>
