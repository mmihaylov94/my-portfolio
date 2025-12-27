<script setup lang="ts">
const { scrollToSection } = useNavigation();
const { skills, timeline, description } = useAbout();
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
							v-for="(paragraph, index) in description"
							:key="index"
							class="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed"
						>
							{{ paragraph }}
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
