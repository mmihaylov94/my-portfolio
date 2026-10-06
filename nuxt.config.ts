// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: ["@nuxt/eslint", "@nuxt/ui"],

	runtimeConfig: {
		public: {
			recaptchaSiteKey: "",
		},
	},

	devtools: {
		enabled: true,
	},

	css: ["~/assets/css/main.css"],

	app: {
		head: {
			link: [
				// Preconnect to Google Fonts for faster loading
				{
					rel: "preconnect",
					href: "https://fonts.googleapis.com",
				},
				{
					rel: "preconnect",
					href: "https://fonts.gstatic.com",
					crossorigin: "",
				},
				// Load fonts as link tags instead of @import for better performance
				{
					rel: "stylesheet",
					href: "https://fonts.googleapis.com/css2?family=Teachers:ital,wght@0,400..800;1,400..800&display=swap",
				},
				{
					rel: "stylesheet",
					href: "https://fonts.googleapis.com/css2?family=Cantarell:ital,wght@0,400;0,700;1,400;1,700&display=swap",
				},
			],
		},
	},

	colorMode: {
		preference: "system",
	},

	icon: {
		clientBundle: {
			scan: true,
			// The chat panel is never prerendered, so every icon it shows has to be in
			// the client bundle, or the browser asks /api/_nuxt_icon for it, which does
			// not exist in production. Scanning finds the names in its .vue files, but
			// drops a misspelt one without a word; a name listed here that does not
			// exist fails the build. tests/unit/chatIcons.test.ts keeps the two in step.
			icons: [
				"heroicons:arrow-path",
				"heroicons:chat-bubble-left-right",
				"heroicons:hand-thumb-down",
				"heroicons:hand-thumb-down-solid",
				"heroicons:hand-thumb-up",
				"heroicons:hand-thumb-up-solid",
				"heroicons:paper-airplane",
				"heroicons:pencil-square",
				"heroicons:x-mark",
			],
		},
	},

	nitro: {
		prerender: {
			// The case study is also reachable via crawlLinks from the index page.
			// It is listed explicitly so it still prerenders if that link changes.
			routes: [
				"/",
				"/case-studies/glotsmith",
				"/sitemap.xml"
			],
			crawlLinks: true,
		},
	},

	devServer: {
		port: 3001,
	},

	vite: {
		server: {
			proxy: {
				"/api": {
					target: "http://localhost:3000",
					changeOrigin: true,
				},
			},
		},
	},

	routeRules: {
		"/**": { prerender: true },
	},

	compatibilityDate: "2025-01-15",

	eslint: {
		config: {
			stylistic: {
				commaDangle: "never",
				braceStyle: "1tbs",
			},
		},
	},
});
