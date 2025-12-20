<script setup lang="ts">
const nav = [
	{ label: "Home", to: "#top" },
	{ label: "About", to: "#about" },
	{ label: "Projects", to: "#projects" },
	{ label: "Contact", to: "#contact" },
];

function onNavClick(to: string) {
	if (!to.startsWith("#")) return;

	const el = document.querySelector(to);
	if (!el) return;

	const offsetPosition = el.getBoundingClientRect().top + window.pageYOffset;

	window.scrollTo({
		top: Math.max(0, offsetPosition),
		behavior: "smooth",
	});
	history.replaceState(null, "", to);
}
</script>

<template>
	<!-- Header -->
	<header
		class="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-primary-300/60 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-xl max-w-6xl w-[calc(100%-2rem)]"
	>
		<div class="px-6 py-3 flex items-center justify-between">
			<NuxtLink
				to="/"
				class="font-semibold text-lg text-gray-900 dark:text-gray-100 hover:text-secondary-600 dark:hover:text-secondary-400 transition-colors"
			>
				<div class="flex items-center gap-2.5">
					<svg
						width="24"
						height="24"
						viewBox="0 0 92 90"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						class="shrink-0 text-primary-500 dark:text-primary-400"
						aria-label="Logo"
					>
						<path
							d="M85.2347 0C85.787 0 86.2347 0.447715 86.2347 1V88.6C86.2347 89.1523 85.787 89.6 85.2347 89.6H78.5307C77.9785 89.6 77.5307 89.1523 77.5307 88.6V7.90378C77.5307 7.63881 77.3159 7.424 77.051 7.424C76.8736 7.424 76.7107 7.52186 76.6274 7.67845L44.9882 67.1535C44.6368 67.8141 43.7109 67.8689 43.2841 67.2543L6.7655 14.6753C6.67357 14.5429 6.52262 14.464 6.36146 14.464C6.08255 14.464 5.85942 14.6956 5.86987 14.9744L8.62786 88.5626C8.64909 89.1291 8.19553 89.6 7.62856 89.6H1.00001C0.433386 89.6 -0.0200444 89.1297 0.000684352 88.5634L3.20747 0.963424C3.22715 0.425735 3.66875 0 4.2068 0H5.31846C5.65121 0 5.96217 0.165514 6.14799 0.441541L45.0354 58.2047C45.459 58.8339 46.4014 58.7809 46.7518 58.1082L76.7385 0.538038C76.9107 0.207389 77.2526 0 77.6254 0H85.2347Z"
							fill="currentColor"
						/>
						<path
							d="M8.66674 22.1L43.5964 83.66C43.9814 84.3386 44.9607 84.3345 45.34 83.6527L73.6166 32.8267C73.6993 32.678 73.7427 32.5107 73.7427 32.3406V26.0393C73.7427 25.0021 72.3585 24.6507 71.8638 25.5623L45.018 75.0311C44.657 75.6965 43.7161 75.7349 43.302 75.1012L8.66674 22.1Z"
							fill="currentColor"
						/>
						<path
							d="M10.2427 0L45.0393 51.3281C45.463 51.9531 46.3998 51.9011 46.7518 51.2331L72.9704 1.4661C73.3212 0.800175 72.8383 0 72.0856 0H69.3481C68.976 0 68.6346 0.206658 68.4621 0.536399L46.4259 42.6525C46.092 43.2906 45.2134 43.3772 44.7614 42.8165L10.2427 0Z"
							fill="currentColor"
						/>
						<path
							d="M8.66674 22.1L19.0618 88.4452C19.1568 89.0518 18.6879 89.6 18.0739 89.6H12.9506C12.4175 89.6 11.9781 89.1818 11.9518 88.6493L8.66674 22.1Z"
							fill="currentColor"
						/>
						<path
							d="M90.9171 89.6C91.4869 89.6 91.9415 89.1246 91.9161 88.5554L87.9627 0V88.6C87.9627 89.1523 88.4105 89.6 88.9627 89.6H90.9171Z"
							fill="currentColor"
						/>
					</svg>
					<span class="whitespace-nowrap">Mihail Mihaylov</span>
				</div>
			</NuxtLink>

			<div class="flex items-center gap-4">
				<nav class="hidden md:flex items-center gap-2">
					<UButton
						v-for="item in nav"
						:key="item.to"
						variant="ghost"
						size="sm"
						class="text-gray-700 dark:text-gray-300 hover:text-secondary-600 dark:hover:text-secondary-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
						@click="onNavClick(item.to)"
					>
						{{ item.label }}
					</UButton>
				</nav>

				<!-- Theme Toggle -->
				<ThemeToggle />

				<!-- Mobile menu -->
				<div class="md:hidden">
					<UDropdownMenu
						:items="[
							nav.map((i) => ({
								label: i.label,
								click: () => onNavClick(i.to),
							})),
						]"
					>
						<UButton
							icon="i-heroicons-bars-3"
							variant="ghost"
							class="text-gray-700 dark:text-gray-300"
							aria-label="Open menu"
						/>
					</UDropdownMenu>
				</div>
			</div>
		</div>
	</header>
</template>
