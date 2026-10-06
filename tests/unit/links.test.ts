import { describe, expect, it } from "vitest";
import { linkTarget } from "../../app/utils/chat/links";

const pages = new Set(["/", "/case-studies/glotsmith"]);
const isRoute = (path: string) => pages.has(path);

describe("linkTarget", () => {
	it("sends a section of the home page there, written either way", () => {
		expect(linkTarget("https://mihaylov.io/#about", isRoute)).toEqual({ kind: "section", section: "about" });
		expect(linkTarget("https://mihaylov.io/?section=projects", isRoute)).toEqual({ kind: "section", section: "projects" });
		expect(linkTarget("https://www.mihaylov.io/#contact", isRoute)).toEqual({ kind: "section", section: "contact" });
		expect(linkTarget("http://mihaylov.io/#about", isRoute)).toEqual({ kind: "section", section: "about" });
	});

	it("sends the home page, or a section it does not have, to the top", () => {
		expect(linkTarget("https://mihaylov.io/", isRoute)).toEqual({ kind: "section", section: "" });
		expect(linkTarget("https://mihaylov.io", isRoute)).toEqual({ kind: "section", section: "" });
		expect(linkTarget("https://mihaylov.io/#services", isRoute)).toEqual({ kind: "section", section: "" });
	});

	it("navigates to another page of the site, keeping its query and fragment", () => {
		expect(linkTarget("https://mihaylov.io/case-studies/glotsmith", isRoute)).toEqual({
			kind: "route",
			path: "/case-studies/glotsmith",
		});
		expect(linkTarget("https://mihaylov.io/case-studies/glotsmith?x=1#costs", isRoute)).toEqual({
			kind: "route",
			path: "/case-studies/glotsmith?x=1#costs",
		});
	});

	it("opens a file on the site in a new tab", () => {
		expect(linkTarget("https://mihaylov.io/Mihail_Mihaylov_CV.pdf", isRoute)).toEqual({
			kind: "external",
			href: "https://mihaylov.io/Mihail_Mihaylov_CV.pdf",
			newTab: true,
		});
	});

	it("opens other sites in a new tab, subdomains of this one included", () => {
		for (const href of ["https://threadline.mihaylov.io/", "https://github.com/mmihaylov94/threadline", "https://example.com/mihaylov.io"]) {
			expect(linkTarget(href, isRoute), href).toEqual({ kind: "external", href, newTab: true });
		}
	});

	it("opens a mailto link in place", () => {
		expect(linkTarget("mailto:someone@example.com", isRoute)).toEqual({
			kind: "external",
			href: "mailto:someone@example.com",
			newTab: false,
		});
	});
});
