<template>
	<div id="top" class="min-h-screen flex flex-col">
		<AppHeader />

		<!-- Main -->
		<main class="flex-1">
			<slot />
		</main>

		<AppFooter />

		<div class="fixed bottom-6 right-6 z-50">
			<button
				type="button"
				title="Coming soon..."
				aria-label="Coming soon..."
				class="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-400 dark:bg-secondary-600 text-white/90 shadow-lg cursor-not-allowed opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
				disabled
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
					/>
				</svg>
			</button>
		</div>
	</div>
</template>
