type ScrollOptions = {
	behavior?: ScrollBehavior;
	updateHistory?: boolean;
};

export function useNavigation() {
	const router = useRouter();
	const route = useRoute();

	const nav = [
		{ label: "Home", to: "" },
		{ label: "About", to: "#about" },
		{ label: "Projects", to: "#projects" },
		{ label: "Contact", to: "#contact" },
	];

	const mobileItems = computed(() => [
		nav.map((i) => ({
			label: i.label,
			onSelect: () => onNavClick(i.to),
		})),
	]);

	function onNavClick(to: string) {
		scrollToSection(to, { updateHistory: true });
	}

	function scrollToSection(id: string, options?: ScrollOptions) {
		if (typeof window === "undefined") return;

		const behavior = options?.behavior ?? "smooth";
		const updateHistory = options?.updateHistory !== false;

		const isTop = id === "" || id === "#top";

		if (isTop) {
			window.scrollTo({ top: 0, behavior });

			if (updateHistory) {
				const { pathname, search } = window.location;
				history.replaceState(null, "", pathname + search);
			}
			return;
		}

		const el = document.querySelector(id);
		if (!el) return;

		const y = el.getBoundingClientRect().top + window.pageYOffset;

		window.scrollTo({ top: Math.max(0, y), behavior });

		if (updateHistory && id.startsWith("#")) {
			history.replaceState(null, "", id);
		}
	}

	/** Public API for logo / home navigation */
	async function goHome() {
		if (route.path === "/") {
			scrollToSection("", { updateHistory: true });
			return;
		}

		await router.push("/");
		requestAnimationFrame(() => scrollToSection("", { updateHistory: true }));
	}

	return {
		nav,
		mobileItems,
		onNavClick,
		scrollToSection,
		goHome,
	};
}
