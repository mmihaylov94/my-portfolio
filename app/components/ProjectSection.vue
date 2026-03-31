<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";

const currentIndex = ref(0);

const { projects } = useProjects();

const carouselViewportHeight = ref("");
const slideEls = ref<Array<HTMLElement | null>>([]);
let slideResizeObserver: ResizeObserver | undefined;
let smallMql: MediaQueryList | undefined;
let onSmallMqlChange: (() => void) | undefined;

const touchStartX = ref<number | null>(null);
const touchStartY = ref<number | null>(null);

function setSlideEl(index: number, el: Element | ComponentPublicInstance | null) {
	if (!el) {
		slideEls.value[index] = null;
		return;
	}
	if (el instanceof HTMLElement) {
		slideEls.value[index] = el;
		return;
	}
	const rootEl = (el as ComponentPublicInstance).$el;
	slideEls.value[index] = rootEl instanceof HTMLElement ? rootEl : null;
}

function updateCarouselViewportHeight() {
	if (!smallMql?.matches) {
		carouselViewportHeight.value = "";
		return;
	}
	const el = slideEls.value[currentIndex.value];
	if (!el) return;
	const h = el.getBoundingClientRect().height;
	if (!h) return;
	carouselViewportHeight.value = `${Math.ceil(h)}px`;
}

function isTypingInFormField(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName.toLowerCase();
	if (tag === "input" || tag === "textarea" || tag === "select") return true;
	return target.isContentEditable;
}

function onKeyDown(event: KeyboardEvent) {
	if (isTypingInFormField(event.target)) return;
	if (event.key === "ArrowLeft") {
		event.preventDefault();
		prevProject();
		return;
	}
	if (event.key === "ArrowRight") {
		event.preventDefault();
		nextProject();
	}
}

function nextProject() {
	currentIndex.value = (currentIndex.value + 1) % projects.length;
}

function prevProject() {
	currentIndex.value =
		currentIndex.value === 0 ? projects.length - 1 : currentIndex.value - 1;
}

function onTouchStart(event: TouchEvent) {
	const t = event.touches.item(0);
	if (!t) return;
	touchStartX.value = t.clientX;
	touchStartY.value = t.clientY;
}

function onTouchMove(event: TouchEvent) {
	const t = event.touches.item(0);
	if (!t) return;
	if (touchStartX.value === null || touchStartY.value === null) return;

	const dx = t.clientX - touchStartX.value;
	const dy = t.clientY - touchStartY.value;

	// If user is scrolling vertically, don't interfere.
	if (Math.abs(dy) > Math.abs(dx) * 1.2) return;

	// If horizontal gesture is dominant, prevent vertical page scroll "grab" feel.
	event.preventDefault();
}

function onTouchEnd(event: TouchEvent) {
	if (touchStartX.value === null || touchStartY.value === null) return;

	const t = event.changedTouches.item(0);
	if (!t) {
		touchStartX.value = null;
		touchStartY.value = null;
		return;
	}

	const dx = t.clientX - touchStartX.value;
	const dy = t.clientY - touchStartY.value;

	const swipeThresholdPx = 50;
	const isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.2;

	if (isHorizontal && Math.abs(dx) >= swipeThresholdPx) {
		if (dx < 0) nextProject();
		else prevProject();
	}

	touchStartX.value = null;
	touchStartY.value = null;
}

// onMounted(() => {
// 	const interval = setInterval(() => {
// 		nextProject();
// 	}, 5000);
// 	onUnmounted(() => clearInterval(interval));
// });

onMounted(() => {
	if (typeof window === "undefined") return;
	window.addEventListener("keydown", onKeyDown, { passive: false });

	smallMql = window.matchMedia("(max-width: 639px)");
	onSmallMqlChange = () => queueMicrotask(updateCarouselViewportHeight);
	if (typeof smallMql.addEventListener === "function") smallMql.addEventListener("change", onSmallMqlChange);
	else (smallMql as unknown as { addListener: (cb: () => void) => void }).addListener(onSmallMqlChange);

	slideResizeObserver = new ResizeObserver(() => updateCarouselViewportHeight());
	const el = slideEls.value[currentIndex.value];
	if (el) slideResizeObserver.observe(el);
	queueMicrotask(updateCarouselViewportHeight);
});

onUnmounted(() => {
	if (typeof window === "undefined") return;
	window.removeEventListener("keydown", onKeyDown);

	slideResizeObserver?.disconnect();
	if (smallMql && onSmallMqlChange) {
		if (typeof smallMql.removeEventListener === "function") smallMql.removeEventListener("change", onSmallMqlChange);
		else (smallMql as unknown as { removeListener: (cb: () => void) => void }).removeListener(onSmallMqlChange);
	}
});

watch(currentIndex, async () => {
	await nextTick();
	if (slideResizeObserver) {
		slideResizeObserver.disconnect();
		const el = slideEls.value[currentIndex.value];
		if (el) slideResizeObserver.observe(el);
	}
	updateCarouselViewportHeight();
});
</script>

<template>
	<section
		class="bg-white dark:bg-gray-900 pt-16 lg:pt-24 lg:min-h-screen lg:flex lg:items-center"
	>
		<div class="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-0">
			<!-- Header -->
			<div class="text-center mb-12">
				<h2
					class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4"
				>
					My Projects
				</h2>
				<p
					class="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-justify"
				>
					A collection of projects I've built, showcasing my skills and
					experience in full-stack development and automation.
				</p>
				<p class="sm:hidden mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
					Swipe left or right to explore projects.
				</p>
			</div>

			<!-- Carousel Container -->
			<div class="relative">
				<!-- Carousel -->
				<div
					class="overflow-hidden transition-[height] duration-300"
					@touchstart="onTouchStart"
					@touchmove="onTouchMove"
					@touchend="onTouchEnd"
					@touchcancel="onTouchEnd"
					:style="carouselViewportHeight ? { height: carouselViewportHeight } : undefined"
				>
					<div
						class="flex items-start lg:items-stretch transition-transform duration-500 ease-in-out"
						:style="{
							transform: `translateX(-${currentIndex * 100}%)`,
						}"
					>
						<div
							v-for="(project, index) in projects"
							:key="project.id"
							class="w-full shrink-0"
							:ref="(el) => setSlideEl(index, el)"
						>
							<ProjectCard
								:project="project"
								@prev="prevProject"
								@next="nextProject"
							/>
						</div>
					</div>
				</div>

				<!-- Carousel Indicators -->
				<div class="hidden sm:flex justify-center gap-2 mt-8">
					<button
						v-for="(project, index) in projects"
						:key="project.id"
						@click="currentIndex = index"
						:class="[
							'w-2 h-2 rounded-full transition-all duration-300',
							currentIndex === index
								? 'bg-secondary-500 w-8'
								: 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500',
						]"
						:aria-label="`Go to project ${index + 1}`"
					/>
				</div>
			</div>
			<SectionDivider />
		</div>
	</section>
</template>
