type ScrollOptions = {
	behavior?: ScrollBehavior;
	updateHistory?: boolean;
};

export function useNavigation() {
	const router = useRouter();
	const route = useRoute();

	const nav = [
		{ label: "Home", to: "" },
		{ label: "About", to: "about" },
		{ label: "Projects", to: "projects" },
		{ label: "Contact", to: "contact" },
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

		const isTop = id === "" || id === "top";

		if (isTop) {
			window.scrollTo({ top: 0, behavior });

			if (updateHistory) {
				router.replace({ path: "/", query: { ...route.query, section: undefined } });
			}
			return;
		}

		const el = document.getElementById(id);
		if (!el) return;

		const y = el.getBoundingClientRect().top + window.pageYOffset;

		window.scrollTo({ top: Math.max(0, y), behavior });

		if (updateHistory) router.replace({ path: "/", query: { ...route.query, section: id } });
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

	// When arriving with ?section=... or navigating back/forward, scroll appropriately.
	function handleRouteSection(section: unknown) {
		if (typeof window === "undefined") return;
		const raw = typeof section === "string" ? section : "";
		if (!raw) {
			window.scrollTo({ top: 0, behavior: "auto" });
			return;
		}
		const el = document.getElementById(raw);
		if (!el) return;
		const y = el.getBoundingClientRect().top + window.pageYOffset;
		window.scrollTo({ top: Math.max(0, y), behavior: "auto" });
	}

	onMounted(() => {
		// Migrate legacy hashes to query-based navigation.
		if (typeof window !== "undefined" && window.location.hash) {
			const hash = window.location.hash.replace(/^#/, "");
			if (hash) router.replace({ path: "/", query: { ...route.query, section: hash }, hash: "" });
		}
		handleRouteSection(route.query.section);
	});

	watch(
		() => route.query.section,
		(section) => handleRouteSection(section)
	);

	return {
		nav,
		mobileItems,
		onNavClick,
		scrollToSection,
		goHome,
	};
}
