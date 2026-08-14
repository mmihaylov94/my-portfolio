<script setup lang="ts">
definePageMeta({
	layout: "default",
});

const siteUrl = "https://mihaylov.io";
const siteName = "Mihail Mihaylov";
const title = "Solutions Architect | Mihail Mihaylov";
const description =
	"Solutions Architect specialising in automation, API-led integrations, enterprise RPA, and production AI systems. Based in Sofia, working remotely.";

useSeoMeta({
	title,
	titleTemplate: "%s",
	description,

	ogTitle: title,
	ogDescription: description,
	ogImage: `${siteUrl}/images/og-image.png`,
	ogUrl: siteUrl,
	ogType: "website",
	ogSiteName: siteName,

	twitterCard: "summary_large_image",
	twitterTitle: title,
	twitterDescription: description,
	twitterImage: `${siteUrl}/images/og-image.png`,

	keywords:
		"solutions architect, solution architecture, business automation, API-led integrations, enterprise RPA, production AI systems, retrieval-augmented generation, n8n, PHP, Node.js, Vue, PostgreSQL, AWS, Sofia, Bulgaria, remote",
	author: siteName,
	robots: "index, follow",
	themeColor: "#ECCAA4",
});

useHead({
	htmlAttrs: { lang: "en" },
	link: [
		{ rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
		{ rel: "canonical", href: siteUrl },
	],
	meta: [
		{ name: "viewport", content: "width=device-width, initial-scale=1" },
		{ name: "format-detection", content: "telephone=no" },
		{ name: "geo.region", content: "BG-22" },
		{ name: "geo.placename", content: "Sofia" },
	],
	script: [
		{
			type: "application/ld+json",
			innerHTML: JSON.stringify({
				"@context": "https://schema.org",
				"@type": "Person",
				name: siteName,
				jobTitle: "Solutions Architect",
				description,
				url: siteUrl,
				image: `${siteUrl}/images/profile_picture.jpg`,
				address: {
					"@type": "PostalAddress",
					addressLocality: "Sofia",
					addressCountry: "BG",
				},
				worksFor: {
					"@type": "Organization",
					name: "Businessmap",
				},
				alumniOf: {
					"@type": "CollegeOrUniversity",
					name: "University of Strathclyde",
				},
				sameAs: [
					"https://www.linkedin.com/in/mihail-m-mihaylov",
					"https://github.com/mmihaylov94",
				],
				knowsAbout: [
					"Solution Architecture",
					"Business Process Automation",
					"API-Led Integrations",
					"Enterprise RPA",
					"Production AI Systems",
					"Retrieval-Augmented Generation",
					"n8n",
					"Microsoft Power Automate",
					"PHP",
					"Node.js",
					"TypeScript",
					"Vue",
					"React",
					"PostgreSQL",
					"AWS",
					"Docker",
				],
			}),
		},
	],
});
</script>

<template>
	<!-- Hero -->
	<section id="hero" class="min-h-screen">
		<HeroSection />
	</section>

	<!-- About -->
	<section id="about">
		<AboutSection />
	</section>

	<!-- Projects -->
	<section id="projects">
		<ProjectSection />
	</section>

	<!-- Contact -->
	<section id="contact">
		<ContactSection />
	</section>
</template>
