export interface Project {
	id: string;
	title: string;
	description: string;
	outcome?: string;
	image: string;
	liveUrl?: string;
	githubUrl?: string;
	technologies: string[];
}

const projects: Project[] = [
	{
		id: "1",
		title: "OmniRetail",
		description: `Retail operations platform consolidating product management, inventory, orders, and checkout in one system. Supports POS
      workflows, real-time stock tracking, order lifecycle management, role-based access, and essential sales reporting for day-to-day
      decision-making.`,
		outcome:
			"Centralises retail operations and reduces stock/sales admin overhead.",
		image: "omni-retail.png",
		liveUrl: "https://omniretail.mihaylov.io",
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
		id: "2",
		title: "Threadline",
		description: "Moderated community forum with category-based discussions, threaded posts with voting and favorites, user profiles, content search and sorting, reporting system, and comprehensive moderation dashboard.",
		outcome: "Demonstrates secure authentication, role-based moderation workflows, and scalable forum architecture.",
		image: "threadline_20260128.png",
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
		id: "3",
		title: "Taskflow",
		description: `Kanban-style project management tool for planning and tracking work across teams. Supports boards, lists, and cards with
      drag-and-drop workflow, assignments, due dates, labels, comments, activity history, and role-based access for controlled collaboration.`,
		outcome:
			"Improves team visibility and delivery tracking in a Kanban workflow.",
		image: "taskflow.png",
		liveUrl: "https://taskflow.mihaylov.io",
		githubUrl: "https://github.com/mmihaylov94/project-three",
		technologies: ["Laravel", "PHP", "Vue", "Tailwind CSS", "REST API"],
	},
	{
		id: "4",
		title: "PawCircle",
		description: `Niche social platform for dog owners to share updates and connect. Includes owner and dog profiles, photo posts, likes and
      comments, follow-based feeds, private messaging, and baseline moderation features to support safe community engagement.`,
		outcome:
			"Drives community engagement through a focused, niche social feed.",
		image: "paw-circle.png",
		liveUrl: "https://paw-circle.mihaylov.io",
		githubUrl: "https://github.com/mmihaylov94/paw-circle",
		technologies: ["Node", "JavaScript", "Vue", "PostgreSQL", "Tailwind CSS"],
	},
	{
		id: "5",
		title: "AI Marketing Reporter",
		description: `Weekly automated reporting AI agent that analyses advertising and analytics data and produces a client-ready performance summary
      with clear recommendations. Pulls data from Meta Ads, Google Ads, and Google Analytics, generates insights, and outputs a report plus a
      ready-to-send email.`,
		outcome:
			"Automates weekly reporting and generates client-ready recommendations.",
		image: "ai-marketing-reporter.png",
		liveUrl: "https://www.youtube.com/@mihaylov-dev",
		technologies: ["n8n", "JavaScript", "REST API"],
	},
];

export const useProjects = () => {
	return {
		projects,
	};
};
