# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Nuxt dev server on port 3001, proxies /api/* to localhost:3000
npm run build      # Static build; output lands in .output/public
npm run preview    # Serve the production build
npm run lint       # ESLint
npm run typecheck  # nuxt typecheck (vue-tsc)

cd api && npm run dev    # Express API on port 3000 (separate npm project, own install)
```

There is no test suite and no test tooling in either package. CI (`.github/workflows/ci.yml`) runs only `lint` and `typecheck` on every push; it does not build. Verify builds locally before claiming a change works.

Builds are slow (minutes) and serialise on the shared `.nuxt` and `.output` caches. Do not run two builds concurrently, and do not edit source while one is running, or the output will be a mix of both states.

## Architecture

### Static site, single page

Nuxt 4 with `routeRules: { "/**": { prerender: true } }`. The Docker image serves **only `.output/public`** through nginx. `.output/server` is never deployed, so anything under `server/` is useful only insofar as it is prerendered at build time. `server/routes/sitemap.xml.ts` works because `/sitemap.xml` is listed in `nitro.prerender.routes`.

`app/pages/index.vue` is the whole site: hero, about, projects, and contact sections stacked in one page. Navigation is **query-parameter based**, not hash based (`/?section=about`), handled by `useNavigation.ts`, which also migrates legacy `#hash` URLs. Anchor links elsewhere should target `/?section=<id>`.

### Content lives in composables

Site copy is data, not markup. `app/composables/useAbout.ts` holds the About paragraphs, grouped skill badges, the experience timeline, and social links. `app/composables/useProjects.ts` holds the project carousel entries. Components render from those, so **copy changes belong in the composables**, not in the `.vue` files.

`Project` supports three mutually exclusive call-to-action shapes: `liveUrl` (external link), `caseStudyUrl` (internal route), and `opensChat: true` (opens the chat widget instead of navigating).

### Adding a route

Two things are required and neither is automatic:

1. A crawlable link from an already-prerendered page (`crawlLinks: true` picks it up), or an explicit entry in `nitro.prerender.routes`. Both are used for the existing case study, deliberately.
2. A manual entry in `server/routes/sitemap.xml.ts`. The sitemap is hand-written, not generated from the router.

### AppButton renders three different elements

`app/components/AppButton.vue` picks its element from props: `to` returns the `NuxtLink` **component imported from `#components`**, `href` returns a plain `<a>`, otherwise `<button>`. Returning the string `"NuxtLink"` instead of the component silently emits a literal `<NuxtLink>` tag into prerendered HTML, producing a dead link with no build error. Use `to` for internal routes, `href` for external URLs, mailto, and files in `public/`.

### Chat assistant bypasses the API

The `@n8n/chat` widget is mounted by `AiChatPopup.vue` in the default layout and posts **directly** to `https://n8n.mihaylov.io/webhook/<NUXT_PUBLIC_N8N_CHAT_WEBHOOK_PATH>` from the browser. It does not go through `api/`. If that variable is unset, the widget never mounts, and anything depending on it (including `useAiChat().openChat()`) becomes a silent no-op.

`useAiChat.ts` and the "Start over" button in `AiChatPopup.vue` both drive the widget by querying and clicking its DOM nodes (`#n8n-chat .chat-window-toggle`, `.chat-window`). This couples the app to `@n8n/chat` internals that no type checker guards.

### The Express API is small

`api/src/server.js` exposes exactly `/api/health` and `/api/contact`. Contact posts are rate limited (5 per 15 minutes), optionally verified against reCAPTCHA v3 (score below 0.5 rejected), then forwarded to an n8n webhook. Missing `RECAPTCHA_SECRET_KEY` disables verification rather than failing, which is intended for local development. The README's claim that the API also handles chat and feedback is out of date.

`api/` has its own `package.json` and `node_modules`; the root install does not cover it. The `pnpm-workspace.yaml` present in the root only pins ignored build dependencies and does not make `api/` a workspace member.

### Environment variables

`NUXT_PUBLIC_*` values are baked into the static bundle **at build time**, so changing them requires a rebuild, and in production they are supplied as Docker build arguments. Server-side secrets (`N8N_WEBHOOK_URL`, `N8N_API_KEY`, `RECAPTCHA_SECRET_KEY`) are read at runtime by the API container from its own `.env`.

## Knowledgebase

`knowledgebase/**/*.md` is **not** part of the build and is never served. It is the corpus for the RAG chat assistant, embedded into PostgreSQL with pgvector **outside this repository**. Editing these files changes nothing until they are re-embedded, which is a manual step the owner performs.

Because the assistant answers hiring questions, the knowledgebase must not contradict the site. When site copy changes (job titles, project descriptions, achievements, contact details), update the corresponding knowledgebase documents in the same change, and say that re-embedding is required.

Conventions in these files: YAML front matter with `doc_id`, `title`, `page_type`, `url`, `source_type`, `tags`, and `last_verified` (bump it when editing). `url` must point at a page that actually exists. Headings are phrased as questions, which matches how the retrieval layer is queried.

## Images

`ProjectCard.buildSrcset` derives `-480w`, `-768w`, and `-960w` filenames from the base image path, unconditionally. A base image without those three siblings produces 404s in the srcset.

`scripts/resize_public_images.py` generates them, but **defaults to widths 480 768 1200**, which does not match what the component requests. Always run it as:

```bash
python scripts/resize_public_images.py --public-dir <dir> --widths 480 768 960 --overwrite
```

Point `--public-dir` at a scratch directory holding only the new images, then copy the results into `public/images/`. Running it against `public/` rewrites variants for every image in the tree.

## Style

- Tabs for indentation, double quotes, semicolons. `eslint.config.mjs` disables all indent rules and relaxes several Vue formatting rules; match surrounding code rather than reformatting.
- Tailwind CSS v4 with the palette and fonts defined via `@theme` in `app/assets/css/main.css`. Use the `primary-*` and `secondary-*` scales rather than raw hex, and always pair a light class with its `dark:` counterpart.
- Nuxt UI v4 provides `UButton`, `UIcon`, and `UDropdownMenu`. Icons come from the locally installed `@iconify-json/heroicons` and `@iconify-json/simple-icons` collections; verify a name exists in `node_modules/@iconify-json/*/icons.json` before using it, since an unknown name fails silently at runtime rather than at build.

## Site copy conventions

British spelling, Oxford commas, no em dashes, no contractions. Plain, direct sentences of varied length. Do not invent facts, numbers, technologies, or achievements for this site: every claim on the page is a claim about a real person's career, so new copy must come from the owner or from existing repository content.

Two email addresses are in use deliberately and must not be unified: `m.mihaylov94@gmail.com` for hiring and recruitment, which is the address printed on the CV in `public/`, and `mihaylov.dev@gmail.com` for project and general inquiries, which is the address published on the site.
