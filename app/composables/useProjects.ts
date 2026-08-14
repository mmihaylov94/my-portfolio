export interface Project {
	id: string;
	title: string;
	description: string;
	outcome?: string;
	image: string;
	liveUrl?: string;
	caseStudyUrl?: string;
	opensChat?: boolean;
	githubUrl?: string;
	technologies: string[];
}

const projects: Project[] = [
	{
		id: "1",
		title: "Glotsmith",
		description:
			"Language-learning SaaS I designed, built, and operate single-handedly, with OCR, translation, and speech, running on AWS with automated deployments and rehearsed database recovery.",
		image: "images/glotsmith.png",
		liveUrl: "https://glotsmith.com",
		caseStudyUrl: "/case-studies/glotsmith",
		technologies: [
			"Vue 3",
			"Node.js",
			"PostgreSQL",
			"AWS",
			"Docker",
			"GitHub Actions",
			"Cloudflare",
			"Paddle",
		],
	},
	{
		id: "2",
		title: "This site's AI assistant",
		description:
			"Retrieval-augmented chat assistant answering questions about my work, built with Nuxt 4 and n8n agent tool calling, backed by pgvector semantic search.",
		image: "images/ai-assistant.png",
		opensChat: true,
		technologies: [
			"Nuxt 4",
			"TypeScript",
			"n8n",
			"pgvector",
			"RAG",
			"AI Agents",
		],
	},
	{
		id: "3",
		title: "n8n Pro Automation Framework",
		description:
			"Production automation framework with contract-defined reusable sub-workflows, idempotency handling, and run observability, published in tiered lite and pro editions with documentation.",
		image: "images/n8n-pro-pack.png",
		githubUrl: "https://github.com/mmihaylov94/n8n-lite-automations",
		technologies: ["n8n", "Automation", "Webhooks", "PostgreSQL"],
	},
	{
		id: "4",
		title: "AI Marketing Reporter",
		description:
			"Automated weekly reporting pipeline built in n8n, pulling Meta Ads, Google Ads, and Google Analytics data into LLM-written performance summaries.",
		image: "images/n8n-marketing-reporter.png",
		liveUrl: "https://www.youtube.com/@mihaylov-dev",
		technologies: ["n8n", "LLM", "Google Analytics", "Meta Ads"],
	},
	{
		id: "5",
		title: "Threadline",
		description:
			"Moderated community forum with threaded posts, report queues, and role management, built with CodeIgniter 4 and PostgreSQL, self-hosted on Docker behind Traefik.",
		image: "images/threadline.png",
		liveUrl: "https://threadline.mihaylov.io",
		githubUrl: "https://github.com/mmihaylov94/threadline",
		technologies: ["CodeIgniter 4", "PostgreSQL", "Docker", "Traefik"],
	},
];

export const useProjects = () => {
	return {
		projects,
	};
};
