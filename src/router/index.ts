import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
	history: createWebHistory(),
	routes: [
		{ path: '/', component: () => import('../pages/Home.vue') },
		{ path: '/about', component: () => import('../pages/About.vue') },
		{ path: '/projects', component: () => import('../pages/Projects.vue') },
		{ path: '/:pathMatch(.*)*', component: () => import('../pages/NotFound.vue') },
	],
})
