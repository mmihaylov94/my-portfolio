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
	paragraphs: string[];
	image?: SectionImage;
}

const siteUrl = "https://mihaylov.io";
const pageUrl = `${siteUrl}/case-studies/glotsmith`;
const title = "Glotsmith case study | Mihail Mihaylov";
const description =
	"What it actually took to build and ship a language-learning SaaS alone. Two months of product, four months of everything else, and the decisions that cost the most.";

// Add an `image` to any section to place a figure directly under its heading.
const sections: CaseStudySection[] = [
	{
		id: "it-started-with-a-cluttered-desk",
		heading: "It started with a cluttered desk",
		paragraphs: [
			"I signed up for a group Italian course. Every week the teacher would send materials: PDFs, audio files, videos. By the third or fourth lesson, my desk looked like this. Two notebooks, one for vocabulary and one for grammar. The textbook open at whatever page we were on. A laptop with Google Translate in one tab and the PDF in another. A phone playing the audio.",
			"Nothing talked to anything else. If I wanted to know how a phrase sounded, I typed it somewhere else. If I wanted to look up a grammar rule I had written down six weeks earlier, I flicked through a notebook. Vocabulary lived in a third place and was never where I needed it.",
			"What I wanted was simple to describe. Put a scanned PDF in, highlight the Italian, translate it, hear it read aloud, and keep the vocabulary and grammar notes attached to the material they came from rather than in a separate book. All of it in one place, on whatever device I happened to have.",
			"So I started building it. After a few weeks of using it myself, it became obvious that this was not only my problem, and Glotsmith became a product rather than a tool. That decision is where the interesting part starts, because building it for myself turned out to be the easy half.",
		],
		image: {
			src: "/images/cluttered-desk.png",
			alt: "A desk covered with two open notebooks, one for vocabulary and one for grammar, an open textbook, a laptop showing a translation tool beside a lesson PDF, and a phone playing the lesson audio",
		},
	},
	{
		id: "the-easy-part-took-two-months",
		heading: "The easy part took two months. The rest took twice that.",
		paragraphs: [
			"Building the thing I wanted took roughly two months. Vue 3 and Vite on the front end, Node and Express behind it, PostgreSQL underneath, OCR, translation, and speech from Google Cloud. Workbooks made of sections, translation rows, vocabulary attached to a course, rich text notes, PDFs rendered in the browser. It worked, and I used it every week. Making it into something a stranger could pay for took another four months, and almost none of that was product work.",
			"This is the part nobody warns you about, and it is the honest answer to what was hardest. It was not a technical problem. It was deciding to keep going, over and over, once it became clear how much of the work had nothing to do with the thing I had set out to build. I was figuring it out as I went, and every week produced another obligation I had not known existed.",
			"Building something for yourself and building something people can buy are different activities that happen to share a codebase.",
		],
	},
	{
		id: "the-decision-that-cost-me-the-most",
		heading: "The decision that cost me the most had nothing to do with code",
		paragraphs: [
			"My first plan was the obvious one: register a limited company, integrate Stripe, take payments. I built it that way. Stripe was integrated and fully tested.",
			"Then I actually worked out what a limited company costs to run. Registration, accounting, filing obligations, and the ongoing overhead of being an entity, all of it due whether or not anyone has ever paid you a penny. Those costs are entirely reasonable once you have a customer base. They are not reasonable before you have one, and I did not have one. So I restructured as a self-employed sole trader, which was a far more proportionate footing for a product with no users yet.",
			"That single decision invalidated the payment integration I had already built and tested. As a freelancer, I could not handle invoicing the way the Stripe setup assumed, and the accountancy costs the restructure was meant to avoid would have come straight back through the payment model instead. Stripe was not the wrong tool because of anything about Stripe. It was the wrong tool because of a decision made two layers away from the code.",
			"The answer was to move to Paddle as a Merchant of Record. A Merchant of Record is the seller rather than simply the payment processor, which means sales tax, VAT, and invoicing become their obligation rather than mine. There is no tax calculation or invoicing logic in my application at all, which for a product selling into both the EU and the US is worth more than any amount of clever billing code.",
			"That migration took a long time, and I did it after I had already finished the Stripe work. I do not regret the outcome. I do regret the order.",
			"The lesson generalises well beyond payments: decide your legal and commercial structure before you write the code that depends on it, because the structure determines the architecture, not the other way around.",
		],
	},
	{
		id: "deciding-what-not-to-build",
		heading: "Deciding what not to build",
		paragraphs: [
			"Working alone means the scarcest resource is your own time, so most of the real decisions are about what to defer. I costed a full TypeScript migration properly, file by file, across roughly 41,000 lines of production code. It came out at somewhere between fifty and sixty working days. It genuinely improves the codebase, and it is planned for an upcoming release. What it was not was something to do before launch, when those two months would have come directly out of shipping. The value of costing it was knowing that number rather than guessing at it.",
			"The infrastructure decisions went the same way. What I ended up running is deliberately boring: a single EC2 instance running Docker Compose behind Cloudflare, with a managed PostgreSQL instance and S3. No Kubernetes and no Redis, because at this size neither justifies its operational cost. Both are on the path for scaling out later, and the application is already shaped for it. Sessions live in the database rather than in memory, and scheduled jobs elect a leader through a database advisory lock, so a second instance can be added without a rewrite when the load justifies one.",
			"The compliance work was the part that surprised me most. A published privacy policy is not just a document. It is a set of factual claims about a running system, and keeping those claims true after launch turned out to be real engineering rather than paperwork. Data retention, consent records, copyright takedown, and the obligations that come with selling into both the EU and the US all ended up as code rather than text on a page.",
		],
	},
	{
		id: "what-i-got-wrong",
		heading: "What I got wrong",
		paragraphs: [
			"I built the entire product without speaking to a single potential customer. No validation, no market research, no conversations. I needed this thing, I enjoyed building it, and I assumed that was enough.",
			"It might be. It might not. I did not find out until registrations opened, having spent six months learning something a few dozen conversations could have told me in a fortnight.",
			"Just because I need something does not mean anyone else does. Next time, the conversations come first.",
		],
	},
	{
		id: "where-it-is-now",
		heading: "Where it is now",
		paragraphs: [
			"Everything is built, tested, and deployed. It runs on AWS with staging and production environments, deployment through GitHub Actions, automated database snapshots before every migration, and a scripted rollback. Roughly 41,000 lines of production code sit behind a 20,000-line test suite with an 85% coverage gate in CI. The final legal review is complete, and registrations opened on 18 August 2026.",
			"If you are thinking about doing something similar, the only advice I have is to keep going. You will hit a lot of moments where it seems pointless, and the difficulty is rarely the code. But even if the product fails, the six months are not wasted, because everything in this piece is something I did not know how to do a year ago.",
			"You only fail if you stop.",
		],
		image: {
			src: "/images/glotsmith.png",
			alt: "The Glotsmith workbench",
		},
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
		<!-- Matches the header bar: same max width and same 1rem side inset. -->
		<div class="w-[calc(100%-2rem)] max-w-6xl mx-auto px-6">
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
					What it actually took to build and ship a SaaS on my own.
				</p>
			</header>

			<!-- Body -->
			<div class="mt-12 space-y-12">
				<section
					v-for="section in sections"
					:id="section.id"
					:key="section.id"
					class="clear-both"
				>
					<h2
						class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4"
					>
						{{ section.heading }}
					</h2>

					<figure
						v-if="section.image"
						class="my-6 sm:float-right sm:w-1/2 lg:w-2/5 sm:ml-8 sm:mt-1 sm:mb-4"
					>
						<img
							:src="section.image.src"
							:srcset="buildSrcset(section.image.src) || undefined"
							sizes="(max-width: 639px) calc(100vw - 4rem), (max-width: 1023px) 50vw, 440px"
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

					<p
						v-for="(paragraph, index) in section.paragraphs"
						:key="index"
						class="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-4 last:mb-0"
					>
						{{ paragraph }}
					</p>
				</section>
			</div>
		</div>
	</article>
</template>
