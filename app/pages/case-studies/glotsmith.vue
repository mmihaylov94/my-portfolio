<script setup lang="ts">
definePageMeta({
	layout: "default",
});

interface SectionImage {
	src: string;
	alt: string;
	caption?: string;
}

interface CaseStudySection {
	id: string;
	heading: string;
	image?: SectionImage;
}

const siteUrl = "https://mihaylov.io";
const pageUrl = `${siteUrl}/case-studies/glotsmith`;
const title = "Glotsmith case study | Mihail Mihaylov";
const description =
	"How I designed, built, deployed, and now operate Glotsmith single-handedly, from architecture and infrastructure through to compliance implemented in code.";

// Add an `image` to any section to place a figure directly under its heading.
const sections: CaseStudySection[] = [
	{
		id: "it-started-with-a-cluttered-desk",
		heading: "It started with a cluttered desk",
		image: {
			src: "/images/glotsmith.png",
			alt: "The Glotsmith workbench",
		},
	},
	{
		id: "the-easy-part-took-two-months",
		heading: "The easy part took two months. The rest took twice that.",
	},
	{
		id: "the-decision-that-cost-me-the-most",
		heading: "The decision that cost me the most had nothing to do with code",
	},
	{
		id: "deciding-what-not-to-build",
		heading: "Deciding what not to build",
	},
	{
		id: "checking-things-instead-of-assuming-them",
		heading: "Checking things instead of assuming them",
	},
	{
		id: "what-i-got-wrong",
		heading: "What I got wrong",
	},
	{
		id: "where-it-is-now",
		heading: "Where it is now",
	},
];

function buildSrcset(path: string) {
	const match = path.match(/^(.*)\.(png|jpe?g|webp)$/i);
	if (!match) return "";
	const stem = match[1] ?? "";
	const extRaw = match[2] ?? "";
	if (!stem || !extRaw) return "";
	const ext = extRaw.toLowerCase();
	return [
		`${stem}-480w.${ext} 480w`,
		`${stem}-768w.${ext} 768w`,
		`${stem}-960w.${ext} 960w`,
	].join(", ");
}

useSeoMeta({
	title,
	titleTemplate: "%s",
	description,

	ogTitle: title,
	ogDescription: description,
	ogImage: `${siteUrl}/images/og-image.png`,
	ogUrl: pageUrl,
	ogType: "article",
	ogSiteName: "Mihail Mihaylov",

	twitterCard: "summary_large_image",
	twitterTitle: title,
	twitterDescription: description,
	twitterImage: `${siteUrl}/images/og-image.png`,

	author: "Mihail Mihaylov",
	robots: "index, follow",
	themeColor: "#ECCAA4",
});

useHead({
	htmlAttrs: { lang: "en" },
	link: [
		{ rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
		{ rel: "canonical", href: pageUrl },
	],
});
</script>

<template>
	<article class="bg-white dark:bg-gray-900 pt-28 sm:pt-32 pb-16 lg:pb-24">
		<div class="w-full px-4 sm:px-6 mx-auto max-w-[70ch]">
			<!-- Back link -->
			<NuxtLink
				to="/?section=projects"
				class="inline-flex items-center gap-2 text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:underline"
			>
				<UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
				Back to projects
			</NuxtLink>

			<!-- Title -->
			<header class="mt-8 space-y-4">
				<h1
					class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight"
				>
					Glotsmith
				</h1>
				<p class="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
					A language-learning SaaS I designed, built, deployed, and operate
					single-handedly.
				</p>
			</header>

			<!-- Body -->
			<div class="mt-12 space-y-12">
				<section v-for="section in sections" :id="section.id" :key="section.id">
					<h2
						class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4"
					>
						{{ section.heading }}
					</h2>

					<figure v-if="section.image" class="my-6">
						<img
							:src="section.image.src"
							:srcset="buildSrcset(section.image.src) || undefined"
							sizes="(max-width: 767px) calc(100vw - 2rem), 70ch"
							:alt="section.image.alt"
							class="w-full h-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg"
							loading="lazy"
							decoding="async"
						/>
						<figcaption
							v-if="section.image.caption"
							class="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center"
						>
							{{ section.image.caption }}
						</figcaption>
					</figure>

					<!-- Prose to be added. -->
				</section>
			</div>
		</div>
	</article>
</template>
