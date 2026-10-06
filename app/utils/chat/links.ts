// Where a link in an answer, or a citation, takes the visitor.
//
// Links to this site stay in it: a section of the home page is scrolled to, and a
// page such as the case study is navigated to without a reload. Everything else
// opens in a new tab, so the conversation is still there afterwards.

/** The site's own hosts, as portfolio-ai's link filter knows them (`_SITE_HOSTS`). */
export const SITE_HOSTS: ReadonlySet<string> = new Set(["mihaylov.io", "www.mihaylov.io"]);

/** The home page's sections, by the ids in app/pages/index.vue. */
const SECTIONS: ReadonlySet<string> = new Set(["about", "projects", "contact"]);

/** A section of the home page; "" is its top. */
export interface SectionTarget { kind: "section"; section: string }
/** Another page of the site, as a router path. */
export interface RouteTarget { kind: "route"; path: string }
/** Anywhere else; mailto links open in place, everything else in a new tab. */
export interface ExternalTarget { kind: "external"; href: string; newTab: boolean }

export type LinkTarget = SectionTarget | RouteTarget | ExternalTarget;

/**
 * Where `href` leads. `isRoute` says whether the site has a page at a path, which
 * is the router's to know: `/case-studies/glotsmith` is a page, and
 * `/Mihail_Mihaylov_CV.pdf` is a file, which opens in a new tab like any other.
 *
 * The prompt gives sections as fragments (`/#about`) and the site's navigation
 * writes them as a query (`/?section=about`); both lead to the same place. A section
 * the page does not have leads to the top.
 */
export function linkTarget(href: string, isRoute: (path: string) => boolean): LinkTarget {
	let url: URL;
	try {
		url = new URL(href);
	} catch {
		return { kind: "external", href, newTab: true };
	}

	if (url.protocol === "mailto:") return { kind: "external", href: url.href, newTab: false };

	const onSite = (url.protocol === "https:" || url.protocol === "http:") && SITE_HOSTS.has(url.hostname);
	if (!onSite) return { kind: "external", href: url.href, newTab: true };

	if (url.pathname === "/") {
		const named = url.searchParams.get("section") ?? url.hash.replace(/^#/, "");
		return { kind: "section", section: SECTIONS.has(named) ? named : "" };
	}
	if (isRoute(url.pathname)) return { kind: "route", path: `${url.pathname}${url.search}${url.hash}` };
	return { kind: "external", href: url.href, newTab: true };
}
