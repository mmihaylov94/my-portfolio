import { defineConfig } from "vitest/config";

// The site's unit tests: the chat's logic in app/utils/chat, run in Node without
// Nuxt. Limited to tests/unit, or Vitest would also pick up api/tests, which are
// the API's own tests for Node's built-in runner.
export default defineConfig({
	test: {
		include: ["tests/unit/**/*.test.ts"],
		environment: "node",
	},
});
