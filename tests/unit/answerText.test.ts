import { describe, expect, it } from "vitest";
import {
	inlineTokens,
	plainText,
	safeHref,
	toBlocks,
	type Inline,
} from "../../app/utils/chat/answerText";

const text = (value: string): Inline => ({ kind: "text", text: value });
const link = (href: string, label: string): Inline => ({ kind: "link", href, label });

/** Every link in some tokens, however deeply they sit in strong or emphasised text. */
function linksIn(nodes: Inline[]): Inline[] {
	return nodes.flatMap((node) =>
		node.kind === "link" ? [node] : node.kind === "text" ? [] : linksIn(node.children),
	);
}

describe("safeHref", () => {
	it("allows http, https and mailto, and nothing else", () => {
		expect(safeHref("https://mihaylov.io/#about")).toBe("https://mihaylov.io/#about");
		expect(safeHref("http://example.com")).toBe("http://example.com/");
		expect(safeHref("mailto:someone@example.com")).toBe("mailto:someone@example.com");

		for (const refused of [
			"javascript:alert(1)",
			"JaVaScRiPt:alert(1)",
			"java\tscript:alert(1)",
			" javascript:alert(1)",
			"vbscript:msgbox(1)",
			"data:text/html,<script>alert(1)</script>",
			"file:///etc/passwd",
			"/case-studies/glotsmith",
			"#about",
			"mihaylov.io/projects/x",
			"https://",
			"https://mihaylov.io\\projects\\x",
		]) {
			expect(safeHref(refused), refused).toBeNull();
		}
	});

	it("gives a www. address https", () => {
		expect(safeHref("www.linkedin.com/in/mihail-m-mihaylov")).toBe("https://www.linkedin.com/in/mihail-m-mihaylov");
		expect(safeHref("WWW.example.com")).toBe("https://www.example.com/");
	});
});

describe("inlineTokens: links", () => {
	it("leaves sentence punctuation after a bare URL outside the link", () => {
		expect(inlineTokens("See https://mihaylov.io/#projects.")).toEqual([
			text("See "),
			link("https://mihaylov.io/#projects", "https://mihaylov.io/#projects"),
			text("."),
		]);
	});

	it("drops the angle brackets of an autolink, and keeps a lone one", () => {
		expect(inlineTokens("<https://mihaylov.io/>")).toEqual([link("https://mihaylov.io/", "https://mihaylov.io/")]);
		expect(inlineTokens("<https://mihaylov.io/ x")).toEqual([
			text("<"),
			link("https://mihaylov.io/", "https://mihaylov.io/"),
			text(" x"),
		]);
	});

	it("links a Markdown label to its target, title or not", () => {
		expect(inlineTokens("Read [the case study](https://mihaylov.io/case-studies/glotsmith \"Glotsmith\") now")).toEqual([
			text("Read "),
			link("https://mihaylov.io/case-studies/glotsmith", "the case study"),
			text(" now"),
		]);
	});

	it("keeps only the label of a link that may not be followed", () => {
		expect(inlineTokens("[click](javascript:alert(1)) here")).toEqual([text("click) here")]);
		expect(inlineTokens("[about](#about)")).toEqual([text("about")]);
	});

	it("never links an address with a backslash, which a browser would follow as a slash", () => {
		// The link filter looked for "/projects", saw "\projects", and let it through;
		// the URL parser would have turned it into /projects/x.
		const tokens = inlineTokens("See https://mihaylov.io\\projects\\x and [this](https://mihaylov.io\\projects\\y).");

		expect(linksIn(tokens)).toEqual([]);
		expect(tokens).toEqual([text("See https://mihaylov.io\\projects\\x and this.")]);
	});

	it("never links a domain without a scheme, or an email address", () => {
		const tokens = inlineTokens("Visit mihaylov.io/projects/x or write to someone@example.com.");
		expect(linksIn(tokens)).toEqual([]);
		expect(tokens).toEqual([text("Visit mihaylov.io/projects/x or write to someone@example.com.")]);
	});

	it("never treats the answer's own private-use characters as links", () => {
		const stand = String.fromCharCode(0xe000);
		const tokens = inlineTokens(`${stand} and https://mihaylov.io/`);
		expect(tokens[0]).toEqual(text(`${String.fromCharCode(0xfffd)} and `));
		expect(linksIn(tokens)).toEqual([link("https://mihaylov.io/", "https://mihaylov.io/")]);
	});

	it("tokenizes a line once, however often it is asked for", () => {
		expect(inlineTokens("A line that repeats.")).toBe(inlineTokens("A line that repeats."));
	});
});

describe("inlineTokens: emphasis", () => {
	it("reads **strong**, *emphasis* and _emphasis_", () => {
		expect(inlineTokens("**Glotsmith** is *his* _own_ product")).toEqual([
			{ kind: "strong", children: [text("Glotsmith")] },
			text(" is "),
			{ kind: "em", children: [text("his")] },
			text(" "),
			{ kind: "em", children: [text("own")] },
			text(" product"),
		]);
	});

	it("wraps a link in the emphasis around it, and leaves the URL alone", () => {
		expect(inlineTokens("at **https://mihaylov.io/#projects**.")).toEqual([
			text("at "),
			{ kind: "strong", children: [link("https://mihaylov.io/#projects", "https://mihaylov.io/#projects")] },
			text("."),
		]);
		expect(linksIn(inlineTokens("https://github.com/some_user/some_repo_name"))).toEqual([
			link("https://github.com/some_user/some_repo_name", "https://github.com/some_user/some_repo_name"),
		]);
	});

	it("leaves arithmetic, snake_case and unmatched delimiters as written", () => {
		for (const line of ["5 * 3 = 15", "call snake_case_name here", "a ** b", "**not closed", "_ spaced _"]) {
			expect(inlineTokens(line), line).toEqual([text(line)]);
		}
	});
});

describe("toBlocks", () => {
	it("splits paragraphs at blank lines, and keeps single line breaks", () => {
		expect(toBlocks("First line\nsecond line\n\nNew paragraph")).toEqual([
			{ kind: "paragraph", lines: [[text("First line")], [text("second line")]] },
			{ kind: "paragraph", lines: [[text("New paragraph")]] },
		]);
	});

	it("reads bulleted and numbered lists, numbered from where they start", () => {
		expect(toBlocks("Projects:\n- Glotsmith\n* Threadline\n\n3. third\n4. fourth")).toEqual([
			{ kind: "paragraph", lines: [[text("Projects:")]] },
			{ kind: "list", ordered: false, start: 1, items: [[text("Glotsmith")], [text("Threadline")]] },
			{ kind: "list", ordered: true, start: 3, items: [[text("third")], [text("fourth")]] },
		]);
	});

	it("does not mistake emphasis at the start of a line for a bullet", () => {
		expect(toBlocks("*Note:* this matters")).toEqual([
			{ kind: "paragraph", lines: [[{ kind: "em", children: [text("Note:")] }, text(" this matters")]] },
		]);
	});

	it("turns a heading into a bold line", () => {
		expect(toBlocks("## Summary\nText")).toEqual([
			{ kind: "paragraph", lines: [[{ kind: "strong", children: [text("Summary")] }], [text("Text")]] },
		]);
	});

	it("handles an answer that is still arriving, cut anywhere", () => {
		const answer = "He built **Glotsmith**, see [the case study](https://mihaylov.io/case-studies/glotsmith).\n\n- one\n- two";
		for (let at = 0; at <= answer.length; at++) {
			expect(() => toBlocks(answer.slice(0, at))).not.toThrow();
		}
	});
});

describe("plainText", () => {
	it("keeps the words and drops the markup", () => {
		expect(plainText("**Glotsmith** is at [his site](https://glotsmith.com).\n\n- one\n- two")).toBe(
			"Glotsmith is at his site. one. two",
		);
	});
});
