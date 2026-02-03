export interface Skill {
	label: string;
	icon?: string;
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

export interface AboutInfo {
	description: string[];
	skills: Skill[];
	timeline: TimelineItem[];
	socialLinks: SocialLink[];
}

const aboutInfo: AboutInfo = {
	description: [
		"I work with small businesses and startups to design and build full-stack web systems from the ground up. I take ownership of the entire process, from shaping the initial idea and architecture to delivering, running, and improving production systems.",
		"My background combines full-stack development with automation, allowing me to replace manual processes, reduce tool sprawl, and improve a company's digital presence. I focus on practical, maintainable solutions that solve real problems and continue to work as the business grows.",
	],
	skills: [
		{ label: "PHP", icon: "i-simple-icons-php" },
		{ label: "CodeIgniter", icon: "i-simple-icons-codeigniter" },
		{ label: "Laravel", icon: "i-simple-icons-laravel" },
		{ label: "HTML", icon: "i-simple-icons-html5" },
		{ label: "CSS", icon: "i-simple-icons-css3" },
		{ label: "JavaScript", icon: "i-simple-icons-javascript" },
		{ label: "React", icon: "i-simple-icons-react" },
		{ label: "Node", icon: "i-simple-icons-nodedotjs" },
		{ label: "Vue.js", icon: "i-simple-icons-vuedotjs" },
		{ label: "Nuxt", icon: "i-simple-icons-nuxtdotjs" },
		{ label: "Tailwind CSS", icon: "i-simple-icons-tailwindcss" },
		{ label: "Firebase", icon: "i-simple-icons-firebase" },
		{ label: "Supabase", icon: "i-simple-icons-supabase" },
		{ label: "Git", icon: "i-simple-icons-git" },
		{ label: "GitHub", icon: "i-simple-icons-github" },
		{ label: "SQL", icon: "i-heroicons-circle-stack" },
		{ label: "MySQL", icon: "i-simple-icons-mysql" },
		{ label: "MariaDB", icon: "i-simple-icons-mariadb" },
		{ label: "PostgreSQL", icon: "i-simple-icons-postgresql" },
		{ label: "n8n", icon: "i-simple-icons-n8n" },
		{ label: "MS Power Automate" },
		{ label: "Zapier", icon: "i-simple-icons-zapier" },
		{ label: "Make.com", icon: "i-simple-icons-make" },
	],
	timeline: [
		{
			title: "Software Developer",
			company: "Businessmap LTD BG",
			period: "2022 - Current",
			description: `Designed and delivered full-stack web systems aligned with business and client needs, replacing spreadsheets and manual
      workflows with reliable, automated solutions. Developed backend services and APIs using PHP (CodeIgniter) and implemented modern
      frontends with JavaScript, React, and Vue, including third-party integrations. Automated and optimised processes across finance, HR,
      and operations using Power Automate, n8n, and Make.com to reduce manual work and improve operational efficiency.`,
		},
		{
			title: "Solution Architect",
			company: "Deloitte LLP UK, Glasgow, UK",
			period: "2021 - 2022",
			description: `Led delivery of end-to-end automation solutions from requirements and design through build, deployment, and production
      ownership. Managed automation infrastructure including servers, VDIs, and control environments, while improving governance,
      standards, and operating procedures. Delivered initiatives that reduced error rates, improved onboarding efficiency, and generated
      measurable cost savings and new revenue.`,
		},
		{
			title: "Automation Engineer",
			company:
				"Momenta People Limited - Contractor for Deloitte LLP UK, Glasgow, UK",
			period: "2020 - 2021",
			description: `Supported and improved large-scale automation estates across multiple clients. Acted as technical escalation point,
      resolved complex incidents, and delivered performance and reliability improvements across multiple solutions. Improved monitoring,
      reporting, documentation, and governance while mentoring engineers and strengthening service delivery.`,
		},
		{
			title: "MSc Advanced Computer Science",
			company: "University of Strathclyde, Glasgow, UK",
			period: "2018 - 2019",
			description: `Postgraduate degree focused on advanced software engineering and systems development, covering software architecture,
      distributed systems, databases, and advanced algorithms. Included hands-on labs and a substantial individual project focused on
      end-to-end solution design and implementation.`,
		},
		{
			title: "BEng (Hons) Computer & Electronic Systems",
			company: "University of Strathclyde, Glasgow, UK",
			period: "2013 - 2017",
			description: `Engineering degree with strong software foundations, covering software engineering, algorithms, databases, computer
      architecture, operating systems, and networked systems. Completed multiple hands-on projects and a final-year capstone focused on
      building complete, reliable applications.`,
		},
	],
	socialLinks: [
		{
			name: "Facebook",
			url: "https://www.facebook.com/m.mihaylov94",
			icon: "i-simple-icons-facebook",
		},
		{
			name: "Instagram",
			url: "https://www.instagram.com/mi.mihaylov",
			icon: "i-simple-icons-instagram",
		},
		{
			name: "LinkedIn",
			url: "https://www.linkedin.com/in/mihail-m-mihaylov",
			icon: "i-simple-icons-linkedin",
		},
		{
			name: "Email",
			url: "mailto:mihaylov.dev@gmail.com",
			icon: "i-heroicons-envelope",
		},
		{
			name: "GitHub",
			url: "https://github.com/mmihaylov94",
			icon: "i-simple-icons-github",
		},
	],
};

export const useAbout = () => {
	return {
		aboutInfo,
		skills: aboutInfo.skills,
		timeline: aboutInfo.timeline,
		description: aboutInfo.description,
		socialLinks: aboutInfo.socialLinks,
	};
};
