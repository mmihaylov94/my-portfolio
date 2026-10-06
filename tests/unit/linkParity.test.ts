import { describe, expect, it } from "vitest";
import { bareLink, findLinks } from "../../app/utils/chat/answerText";
import fixture from "./fixtures/link-parity.json";

// The answer renderer's link grammar against the one portfolio-ai's link filter
// uses. The fixture holds what Python's `_LINK` matched in each sample, and how the
// filter trims a bare URL; tests/unit/fixtures/link-parity.py writes it, and says
// how to run it when the pattern changes.

describe("the link grammar matches portfolio-ai's", () => {
	it("has samples to compare, including ones with links", () => {
		expect(fixture.samples.length).toBeGreaterThanOrEqual(25);
		expect(fixture.samples.filter((sample) => sample.matches.length > 0).length).toBeGreaterThanOrEqual(20);
	});

	for (const [index, sample] of fixture.samples.entries()) {
		it(`sample ${index}: ${JSON.stringify(sample.text).slice(0, 60)}`, () => {
			const found = findLinks(sample.text).map(({ match, label, target, title, url }) => ({
				match,
				label,
				target,
				title,
				url,
				stripped: url === null ? null : bareLink(url),
			}));
			expect(found).toEqual(sample.matches);
		});
	}
});
