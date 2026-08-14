const SITE_URL = "https://mihaylov.io";

function toIsoDate(date: Date) {
	return date.toISOString();
}

function escapeXml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

function urlEntry(
	loc: string,
	lastmod: Date,
	changefreq?: string,
	priority?: number,
) {
	const parts = [
		`<loc>${escapeXml(loc)}</loc>`,
		`<lastmod>${escapeXml(toIsoDate(lastmod))}</lastmod>`,
	];

	if (changefreq)
		parts.push(`<changefreq>${escapeXml(changefreq)}</changefreq>`);
	if (typeof priority === "number")
		parts.push(`<priority>${priority.toFixed(1)}</priority>`);

	return `<url>${parts.join("")}</url>`;
}

export default defineEventHandler((event) => {
	setHeader(event, "content-type", "application/xml; charset=utf-8");

	// Homepage sections are query parameters, not separate sitemap URLs.
	// Standalone routes, such as case studies, are listed individually.
	const now = new Date();
	const urls = [
		urlEntry(`${SITE_URL}/`, now, "weekly", 1.0),
		urlEntry(`${SITE_URL}/case-studies/glotsmith`, now, "monthly", 0.8),
	];

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...urls,
		"</urlset>",
	].join("");
});
