import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The chat panel is never prerendered, so its icons must all be in the client
// bundle (see nuxt.config.ts). The build fails on a name listed there that does not
// exist, but an icon a component uses and the list leaves out would be requested
// from /api/_nuxt_icon at runtime, which does not exist in production. This keeps
// the list and the components in step, and checks each name before a build does.

const root = new URL("../../", import.meta.url);
const chatComponents = new URL("app/components/chat/", root);

function usedByTheChat(): string[] {
	const names = new Set<string>();
	for (const file of readdirSync(chatComponents).filter((name) => name.endsWith(".vue"))) {
		const source = readFileSync(new URL(file, chatComponents), "utf8");
		for (const found of source.matchAll(/i-heroicons-([a-z0-9-]+)/g)) names.add(`heroicons:${found[1]}`);
	}
	return [...names].sort();
}

function listedForTheBundle(): string[] {
	const config = readFileSync(new URL("nuxt.config.ts", root), "utf8");
	const list = /clientBundle:\s*\{[\s\S]*?icons:\s*\[([\s\S]*?)\]/.exec(config)?.[1] ?? "";
	return [...list.matchAll(/"([a-z0-9-]+:[a-z0-9-]+)"/g)].map((found) => found[1] ?? "").sort();
}

describe("the chat's icons", () => {
	it("are all listed for the client bundle, and every listed one is used", () => {
		const used = usedByTheChat();
		expect(used.length).toBeGreaterThan(0);
		expect(listedForTheBundle()).toEqual(used);
	});

	it("all exist in the installed heroicons collection", () => {
		const collection = JSON.parse(
			readFileSync(new URL("node_modules/@iconify-json/heroicons/icons.json", root), "utf8"),
		) as { icons: Record<string, unknown>; aliases?: Record<string, unknown> };
		for (const name of listedForTheBundle()) {
			const icon = name.replace(/^heroicons:/, "");
			expect(icon in collection.icons || icon in (collection.aliases ?? {}), name).toBe(true);
		}
	});
});
