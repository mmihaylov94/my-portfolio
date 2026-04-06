export interface Project {
	id: string;
	title: string;
	description: string;
	outcome?: string;
	image: string;
	liveUrl?: string;
	liveLabel?: string;
	liveDisabled?: boolean;
	githubUrl?: string;
	technologies: string[];
}

const projects: Project[] = [
	{
		id: "1",
		title: "AI Marketing Reporter",
		description:
			"Weekly automated reporting AI agent that analyses advertising and analytics data and produces a client-ready performance summary with clear recommendations. Pulls data from Meta Ads, Google Ads, and Google Analytics, generates insights, and outputs a report plus a ready-to-send email.",
		outcome:
			"Automates weekly reporting and generates client-ready recommendations.",
		image: "images/n8n-marketing-reporter.png",
		liveUrl: "https://www.youtube.com/@mihaylov-dev",
		technologies: ["n8n", "JavaScript", "REST API"],
	},
	{
		id: "2",
		title: "n8n Pro Automation Framework",
		description:
			"Production-ready automation framework for n8n with reusable utility sub-workflows, idempotency handling, run logging, observability, and structured metrics. Includes outcome-driven packs such as Stripe Webhook Pro, Lead Intake Pro, API Sync Pro, and Inbound Email Intake Pro.",
		outcome:
			"Enables reliable, scalable, client-ready automation systems with built-in observability and error handling.",
		image: "images/n8n-pro-pack.png",
		liveUrl: "https://mihaylov.io",
		githubUrl: "https://github.com/mmihaylov94/n8n-lite-automations",
		technologies: [
			"n8n",
			"JavaScript",
			"Webhook Architecture",
			"Stripe API",
			"Google Sheets API",
			"Slack API",
			"REST API",
			"Automation Design",
		],
	},
	{
		id: "3",
		title: "Threadline",
		description:
			"Moderated community forum with category-based discussions, threaded posts with voting and favorites, user profiles, content search and sorting, reporting system, and comprehensive moderation dashboard.",
		outcome:
			"Demonstrates secure authentication, role-based moderation workflows, and scalable forum architecture.",
		image: "images/threadline_20260128.png",
		liveUrl: "https://threadline.mihaylov.io",
		githubUrl: "https://github.com/mmihaylov94/threadline",
		technologies: [
			"CodeIgniter 4",
			"PHP",
			"PostgreSQL",
			"HTML",
			"JavaScript",
			"CSS",
			"Bootstrap 5",
		],
	},
	{
		id: "4",
		title: "DueNote",
		description:
			"Language-learning notebook for studying from real content. Organize courses and workbooks made of reorderable sections (translations, vocabulary, grammar notes, and embedded videos) with auto-save, plus a course-wide aggregated vocabulary view.",
		outcome:
			"Turns real-world learning materials into structured, searchable study notes with integrated vocabulary building.",
		image: "images/duenote.png",
		liveUrl: "https://duenote.mihaylov.io",
		githubUrl: "https://github.com/mmihaylov94/duenote",
		technologies: [
			"Vue 3",
			"Vite",
			"Tailwind CSS",
			"Node.js",
			"Express",
			"PostgreSQL",
			"DeepL API",
			"OAuth 2.0",
		],
	},
	{
		id: "5",
		title: "OmniRetail",
		description:
			"Retail operations platform consolidating product management, inventory, orders, and checkout in one system. Supports POS workflows, real-time stock tracking, order lifecycle management, role-based access, and essential sales reporting for day-to-day decision-making.",
		outcome:
			"Centralises retail operations and reduces stock/sales admin overhead.",
		image: "images/omni-retail.png",
		liveUrl: "https://omniretail.mihaylov.io",
		liveLabel: "Coming Soon",
		liveDisabled: true,
		githubUrl: "https://github.com/mmihaylov94/omniretail-app",
		technologies: [
			"CodeIgniter",
			"PHP",
			"MySQL",
			"HTML",
			"JavaScript",
			"React",
			"Tailwind CSS",
		],
	},
	{
		id: "6",
		title: "Taskflow",
		description:
			"Kanban-style project management tool for planning and tracking work across teams. Supports boards, lists, and cards with drag-and-drop workflow, assignments, due dates, labels, comments, activity history, and role-based access for controlled collaboration.",
		outcome:
			"Improves team visibility and delivery tracking in a Kanban workflow.",
		image: "images/taskflow.png",
		liveUrl: "https://taskflow.mihaylov.io",
		liveLabel: "Coming Soon",
		liveDisabled: true,
		technologies: ["Laravel", "PHP", "Vue", "Tailwind CSS", "REST API"],
	},
	{
		id: "7",
		title: "PawCircle",
		description:
			"Niche social platform for dog owners to share updates and connect. Includes owner and dog profiles, photo posts, likes and comments, follow-based feeds, private messaging, and baseline moderation features to support safe community engagement.",
		outcome:
			"Drives community engagement through a focused, niche social feed.",
		image: "images/paw-circle.png",
		liveUrl: "https://paw-circle.mihaylov.io",
		liveLabel: "Coming Soon",
		liveDisabled: true,
		technologies: ["Node", "JavaScript", "Vue", "PostgreSQL", "Tailwind CSS"],
	},
];

export const useProjects = () => {
	return {
		projects,
	};
};
