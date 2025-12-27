export function scrollToSection(
	id: string,
	options?: { behavior?: ScrollBehavior; updateHistory?: boolean }
) {
	if (typeof window === "undefined") return;

	const targetId = id === "#top" ? "#hero" : id;
	const el = document.querySelector(targetId);
	if (!el) return;

	const elementPosition = el.getBoundingClientRect().top;
	const offsetPosition = elementPosition + window.pageYOffset;

	window.scrollTo({
		top: Math.max(0, offsetPosition),
		behavior: options?.behavior ?? "smooth",
	});

	if (options?.updateHistory !== false && id.startsWith("#")) {
		history.replaceState(null, "", id);
	}
}

export const useNavigation = () => {
	return {
		scrollToSection,
	};
};
