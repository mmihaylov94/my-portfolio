<script setup lang="ts">
definePageMeta({
	layout: "default",
});

const siteUrl = "https://mihaylov.io";
const siteName = "Mihail Mihaylov";
const title = "Mihail Mihaylov | Automation & Full-Stack Developer";
const description =
	"Automation & full-stack developer building integrations and workflows that replace manual work and spreadsheets for startups and small businesses.";

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
		"full-stack developer, business automation, workflow automation, internal tools, system integrations, replace spreadsheets, custom web app, PHP, JavaScript, React, Vue, Sofia, Bulgaria",
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
				jobTitle: "Full-Stack Developer & Automation Engineer",
				description,
				url: siteUrl,
				image: `${siteUrl}/images/profile_picture.jpg`,
				address: {
					"@type": "PostalAddress",
					addressLocality: "Sofia",
					addressCountry: "BG",
				},
				sameAs: [
					"https://www.linkedin.com/in/mihail-m-mihaylov",
					"https://github.com/mmihaylov94",
				],
				knowsAbout: [
					"Full-Stack Web Development",
					"Business Process Automation",
					"System Integrations",
					"Workflow Automation",
					"PHP",
					"JavaScript",
					"React",
					"Vue",
					"SQL",
					"n8n",
					"Microsoft Power Automate",
					"Make.com",
				],
			}),
		},
	],
});
</script>

<template>
	<!-- Hero -->
	<section id="hero" class="h-screen">
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
