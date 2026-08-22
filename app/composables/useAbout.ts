export interface Skill {
	label: string;
	icon?: string;
}

export interface SkillGroup {
	label: string;
	skills: Skill[];
}

export interface TimelineItem {
	title: string;
	company: string;
	period: string;
	description: string;
}

export interface SocialLink {
	name: string;
	url: string;
	icon: string;
}

export interface ContactEmail {
	label: string;
	address: string;
	purpose: string;
	icon: string;
}

export interface AboutInfo {
	description: string[];
	skillGroups: SkillGroup[];
	timeline: TimelineItem[];
	contactEmails: ContactEmail[];
	socialLinks: SocialLink[];
}

const aboutInfo: AboutInfo = {
	description: [
		"I am a Solutions Architect at Businessmap, based in Sofia and working remotely. I have spent the past six years working with clients, engineering teams, and business stakeholders, which has taught me to ask the right questions and keep technical work grounded in what people actually need.",
		"I enjoy taking ownership of problems from the first conversation through to a finished, dependable solution. I work well independently, and I value straightforward communication and software that is still understandable long after it has been delivered."
	],
	skillGroups: [
		{
			label: "AI",
			skills: [
				{ label: "LLM APIs", icon: "i-heroicons-cpu-chip" },
				{
					label: "Retrieval-augmented generation",
					icon: "i-heroicons-magnifying-glass",
				},
				{ label: "Vector search", icon: "i-heroicons-magnifying-glass" },
				{ label: "pgvector", icon: "i-simple-icons-postgresql" },
				{ label: "AI agents", icon: "i-heroicons-sparkles" },
				{ label: "Tool calling", icon: "i-heroicons-wrench-screwdriver" },
				{ label: "MCP", icon: "i-simple-icons-modelcontextprotocol" },
				{ label: "Claude Skills", icon: "i-simple-icons-claude" },
			],
		},
		{
			label: "Automation",
			skills: [
				{ label: "n8n", icon: "i-simple-icons-n8n" },
				{
					label: "Microsoft Power Automate",
					icon: "i-simple-icons-powerautomate",
				},
				{ label: "Zapier", icon: "i-simple-icons-zapier" },
				{ label: "UiPath", icon: "i-simple-icons-uipath" },
				{ label: "Automation Anywhere" },
				{ label: "Microsoft Power Platform" },
			],
		},
		{
			label: "Backend",
			skills: [
				{ label: "PHP (CodeIgniter, Laravel)", icon: "i-simple-icons-php" },
				{ label: "Node.js", icon: "i-simple-icons-nodedotjs" },
				{ label: "Express", icon: "i-simple-icons-express" },
				{ label: "TypeScript", icon: "i-simple-icons-typescript" },
				{ label: "REST APIs", icon: "i-heroicons-code-bracket" },
				{ label: "Webhooks", icon: "i-heroicons-bolt" },
			],
		},
		{
			label: "Frontend",
			skills: [
				{ label: "Vue 3", icon: "i-simple-icons-vuedotjs" },
				{ label: "Nuxt", icon: "i-simple-icons-nuxt" },
				{ label: "React", icon: "i-simple-icons-react" },
				{ label: "Vite", icon: "i-simple-icons-vite" },
				{ label: "Tailwind CSS", icon: "i-simple-icons-tailwindcss" },
			],
		},
		{
			label: "Data",
			skills: [
				{ label: "PostgreSQL", icon: "i-simple-icons-postgresql" },
				{ label: "pgvector", icon: "i-simple-icons-postgresql" },
				{ label: "MySQL", icon: "i-simple-icons-mysql" },
				{ label: "SQL Server", icon: "i-simple-icons-microsoftsqlserver" },
			],
		},
		{
			label: "Cloud and DevOps",
			skills: [
				{
					label: "AWS (EC2, RDS, S3, IAM, SES, SNS)",
					icon: "i-simple-icons-amazonwebservices",
				},
				{ label: "Docker", icon: "i-simple-icons-docker" },
				{ label: "Docker Compose", icon: "i-simple-icons-docker" },
				{ label: "GitHub Actions", icon: "i-simple-icons-githubactions" },
				{ label: "Traefik", icon: "i-simple-icons-traefikproxy" },
				{ label: "Cloudflare", icon: "i-simple-icons-cloudflare" },
				{ label: "Linux", icon: "i-simple-icons-linux" },
			],
		},
	],
	timeline: [
		{
			title: "Solutions Architect",
			company: "Businessmap",
			period: "Jun 2023 – Present",
			description: `Design and deliver automation, integration, and full-stack systems across the business. Migrated a PHP monolith into a
      single sign-on portal, consolidating 60 internal tools into reusable products now used by over 100 clients, which became the basis
      for a 50% increase in Solution Architecture team revenue. Built a bi-directional integration with an external CRM, a Partner Hub
      integrating external CRM and billing systems that cut quarterly commission processing from two weeks to two days, and a custom
      MCP server with supporting Claude Skills behind an SSO-authenticated proxy that filters personal data out of every response.`,
		},
		{
			title: "Technical Solution Architect",
			company: "Deloitte LLP UK, Glasgow, UK",
			period: "Mar 2022 – Jun 2023",
			description: `Led end-to-end RPA delivery from proposal and requirements through build, testing, deployment, and hypercare, while
      mentoring developers. Won four new client projects by introducing the Microsoft Power Platform into the team's stack. Delivered
      document processing automation that saved clients over 10,000 hours and £250,000 annually, and timesheet and forecasting solutions
      that saved a further 5,000 hours a year. Owned the RPA infrastructure, including servers, VDIs, and control rooms.`,
		},
		{
			title: "Automation Engineer to Solution Architect",
			company: "Momenta Group Global (contractor for Deloitte LLP UK)",
			period: "May 2020 – Mar 2022",
			description: `Progressed from graduate engineer to solution architect in under two years across RPA design, delivery, support, and
      team leadership. Generated over £80,000 in additional revenue by designing more than 40 automation changes to client requirements.
      Cut error rates by 25% and support time by 15% by leading the migration of internal automations onto a new platform. Line-managed a
      team of nine engineers, advancing two to senior within six months.`,
		},
		{
			title: "MSc Advanced Computer Science (Distinction)",
			company: "University of Strathclyde, Glasgow, UK",
			period: "2018 - 2019",
			description: `Postgraduate degree focused on advanced software engineering and systems development, covering software architecture,
      distributed systems, databases, and advanced algorithms. Included hands-on labs and a substantial individual project focused on
      end-to-end solution design and implementation.`,
		},
		{
			title: "BEng (Hons) Computer and Electronic Systems",
			company: "University of Strathclyde, Glasgow, UK",
			period: "2013 - 2017",
			description: `Engineering degree with strong software foundations, covering software engineering, algorithms, databases, computer
      architecture, operating systems, and networked systems. Completed multiple hands-on projects and a final-year capstone focused on
      building complete, reliable applications.`,
		},
	],
	contactEmails: [
		{
			label: "Hiring and recruitment",
			address: "m.mihaylov94@gmail.com",
			purpose: "Roles, recruiters, and anyone working from my CV",
			icon: "i-heroicons-briefcase",
		},
		{
			label: "Projects and general",
			address: "mihaylov.dev@gmail.com",
			purpose: "Project inquiries, collaboration, and everything else",
			icon: "i-heroicons-envelope",
		},
	],
	socialLinks: [
		{
			name: "LinkedIn",
			url: "https://www.linkedin.com/in/mihail-m-mihaylov",
			icon: "i-simple-icons-linkedin",
		},
		{
			name: "GitHub",
			url: "https://github.com/mmihaylov94",
			icon: "i-simple-icons-github",
		},
		{
			name: "Email",
			url: "mailto:mihaylov.dev@gmail.com",
			icon: "i-heroicons-envelope",
		},
	],
};

export const useAbout = () => {
	return {
		aboutInfo,
		skillGroups: aboutInfo.skillGroups,
		timeline: aboutInfo.timeline,
		description: aboutInfo.description,
		contactEmails: aboutInfo.contactEmails,
		socialLinks: aboutInfo.socialLinks,
	};
};
