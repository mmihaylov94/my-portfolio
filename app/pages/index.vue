<script setup lang="ts">
definePageMeta({
	layout: "default",
});

const siteUrl = "https://mihaylov.io";
const siteName = "Mihail Mihaylov - Full-Stack Developer & Automation Engineer";
const description =
	"Full-stack developer and automation engineer with 6+ years of experience. Specializing in C#, Python, Java, RPA solutions, and Microsoft Power Platform. Based in Sofia, Bulgaria.";

useSeoMeta({
	title: siteName,
	titleTemplate: "%s",
	description,
	ogTitle: siteName,
	ogDescription: description,
	ogImage: `${siteUrl}/profile_picture.jpg`,
	ogUrl: siteUrl,
	ogType: "website",
	ogSiteName: siteName,
	twitterTitle: siteName,
	twitterDescription: description,
	twitterImage: `${siteUrl}/profile_picture.jpg`,
	twitterCard: "summary_large_image",
	twitterSite: "@mihaylov_dev",
	twitterCreator: "@mihaylov_dev",
	keywords:
		"full-stack developer, automation engineer, RPA, Python, C#, Java, Microsoft Power Platform, software engineer, Sofia, Bulgaria, solution architect",
	author: "Mihail Mihaylov",
	robots: "index, follow",
	themeColor: "#ECCAA4",
});

useHead({
	htmlAttrs: {
		lang: "en",
	},
	link: [
		{
			rel: "icon",
			type: "image/svg+xml",
			href: "/logo.svg",
		},
		{
			rel: "canonical",
			href: siteUrl,
		},
	],
	meta: [
		{
			name: "viewport",
			content: "width=device-width, initial-scale=1",
		},
		{
			name: "format-detection",
			content: "telephone=no",
		},
		{
			name: "geo.region",
			content: "BG-22",
		},
		{
			name: "geo.placename",
			content: "Sofia",
		},
	],
});

// Structured Data (JSON-LD)
useHead({
	script: [
		{
			type: "application/ld+json",
			innerHTML: JSON.stringify({
				"@context": "https://schema.org",
				"@type": "Person",
				name: "Mihail Mihaylov",
				jobTitle: "Solution Architect & Full-Stack Developer",
				description: description,
				url: siteUrl,
				image: `${siteUrl}/profile_picture.jpg`,
				email: "m.mihaylov94@gmail.com",
				address: {
					"@type": "PostalAddress",
					addressLocality: "Sofia",
					addressRegion: "Sofia",
					addressCountry: "BG",
				},
				sameAs: [
					"https://www.linkedin.com/in/mihail-mihaylov",
					"https://github.com/mihaylov-dev",
					"https://www.facebook.com/mihail.mihaylov",
					"https://www.instagram.com/mihail.mihaylov",
				],
				alumniOf: {
					"@type": "EducationalOrganization",
					name: "University of Strathclyde",
					address: {
						"@type": "PostalAddress",
						addressLocality: "Glasgow",
						addressCountry: "GB",
					},
				},
				knowsAbout: [
					"Full-Stack Development",
					"Automation Engineering",
					"RPA (Robotic Process Automation)",
					"Python",
					"C#",
					"Java",
					"Microsoft Power Platform",
					"SQL Server",
					"Software Architecture",
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
	<section id="about" class="scroll-mt-24">
		<AboutSection />
	</section>

	<!-- Projects -->
	<section id="projects" class="scroll-mt-20">
		<ProjectSection />
	</section>

	<!-- Contact -->
	<section id="contact" class="scroll-mt-20">
		<ContactSection />
	</section>
</template>
