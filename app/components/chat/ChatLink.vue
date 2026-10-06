<script setup lang="ts">
import { linkTarget } from "~/utils/chat/links";

// A link in an answer or a citation. `href` has already passed safeHref(): it is an
// http, https or mailto address.
const props = defineProps<{ href: string }>();

const router = useRouter();
const route = useRoute();
const { isModal, closeChat } = useAiChat();

const target = computed(() => linkTarget(props.href, (path) => router.resolve(path).matched.length > 0));

const LINK_CLASS = "font-medium text-secondary-800 underline underline-offset-2 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-secondary-200";

// Following a link to the site from the full-screen panel closes it, so the visitor
// sees where they went. The conversation is still there when they reopen it.
function leavePanel() {
	if (isModal.value) closeChat();
}

// A section of the home page, found the way the header's navigation finds it.
// Deliberately not through useNavigation(): its onMounted scrolls the page to the
// `section` in the address, or to the top when there is none, and this component
// mounts whenever an answer with a link appears.
async function toSection(event: MouseEvent, section: string) {
	// A new tab or window, by modifier key or middle click: the browser's job.
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
	event.preventDefault();
	leavePanel();
	await nextTick();

	if (route.path !== "/") {
		// The home page scrolls to its `section` as it mounts.
		await navigateTo({ path: "/", query: section === "" ? {} : { section } });
		return;
	}
	const current = typeof route.query.section === "string" ? route.query.section : "";
	if (current !== section) {
		// The home page scrolls when its `section` changes.
		await router.replace({ path: "/", query: { ...route.query, section: section === "" ? undefined : section } });
		return;
	}
	// Already the section in the address, so nothing will react to it: scroll here.
	const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
	const element = section === "" ? null : document.getElementById(section);
	const top = element === null ? 0 : element.getBoundingClientRect().top + window.scrollY;
	window.scrollTo({ top: Math.max(0, top), behavior });
}
</script>

<template>
	<a
		v-if="target.kind === 'section'"
		:href="target.section === '' ? '/' : `/?section=${target.section}`"
		:class="LINK_CLASS"
		@click="toSection($event, target.section)"
	><slot /></a>
	<NuxtLink v-else-if="target.kind === 'route'" :to="target.path" :class="LINK_CLASS" @click="leavePanel"><slot /></NuxtLink>
	<a
		v-else
		:href="target.href"
		:class="LINK_CLASS"
		:target="target.newTab ? '_blank' : undefined"
		:rel="target.newTab ? 'noopener noreferrer' : undefined"
	><slot /><span v-if="target.newTab" class="sr-only"> (opens in a new tab)</span></a>
</template>
