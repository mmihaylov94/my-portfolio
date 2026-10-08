# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Nuxt dev server on port 3001, proxies /api/* to localhost:3000
npm run build      # Static build; output lands in .output/public
npm run preview    # Serve the production build
npm run lint       # ESLint
npm run typecheck  # nuxt typecheck (vue-tsc), then the unit tests' own tsc -p tests
npm test           # Vitest: the chat's logic in app/utils/chat (tests/unit)

cd api && npm run dev    # Express API on port 3000 (separate npm project, own install)
cd api && npm test       # API tests, Node's built-in runner, no extra dependencies
```

The site's unit tests (`tests/unit/`) cover the chat's logic, which is plain TypeScript run in Node without Nuxt; the components are checked by hand. They sit outside `app/` because no tsconfig Nuxt generates includes `tests/unit`, so `tests/tsconfig.json` type checks them and `npm run typecheck` runs it. `vitest.config.ts` keeps Vitest to `tests/unit`, or it would pick up the API's `node:test` files. Vitest needs Node 22.12 or newer. The API has its own tests (`api/tests/`). CI (`.github/workflows/ci.yml`) runs `lint`, `typecheck` and `test` for the site on Node 22, and the API tests on Node 20, the version the API image runs, on every push. It does not build the site. Verify builds locally before claiming a change works. `docker-frontend.yml` and `docker-api.yml` run their checks again before they publish an image, so a failing check never becomes `:latest`.

Builds are slow (minutes) and serialise on the shared `.nuxt` and `.output` caches. Do not run two builds concurrently, and do not edit source while one is running, or the output will be a mix of both states.

## Architecture

### Static site, single page

Nuxt 4 with `routeRules: { "/**": { prerender: true } }`. The Docker image serves **only `.output/public`** through nginx. `.output/server` is never deployed, so anything under `server/` is useful only insofar as it is prerendered at build time. `server/routes/sitemap.xml.ts` works because `/sitemap.xml` is listed in `nitro.prerender.routes`.

`app/pages/index.vue` is the whole site: hero, about, projects, and contact sections stacked in one page. Navigation is **query-parameter based**, not hash based (`/?section=about`), handled by `useNavigation.ts`, which also migrates legacy `#hash` URLs. Anchor links elsewhere should target `/?section=<id>`.

### Content lives in composables

Site copy is data, not markup. `app/composables/useAbout.ts` holds the About paragraphs, grouped skill badges, the experience timeline, and social links. `app/composables/useProjects.ts` holds the project carousel entries. Components render from those, so **copy changes belong in the composables**, not in the `.vue` files.

`Project` supports four calls to action, and a card shows a button for each one it sets: `liveUrl` (external link), `caseStudyUrl` (internal route), `opensChat: true` (opens the chat instead of navigating), and `githubUrl` (the source).

### Adding a route

Two things are required and neither is automatic:

1. A crawlable link from an already-prerendered page (`crawlLinks: true` picks it up), or an explicit entry in `nitro.prerender.routes`. Both are used for the existing case study, deliberately.
2. A manual entry in `server/routes/sitemap.xml.ts`. The sitemap is hand-written, not generated from the router.

### AppButton renders three different elements

`app/components/AppButton.vue` picks its element from props: `to` returns the `NuxtLink` **component imported from `#components`**, `href` returns a plain `<a>`, otherwise `<button>`. Returning the string `"NuxtLink"` instead of the component silently emits a literal `<NuxtLink>` tag into prerendered HTML, producing a dead link with no build error. Use `to` for internal routes, `href` for external URLs, mailto, and files in `public/`.

### The AI chat

`app/components/chat/ChatWidget.vue`, in the default layout, is the launcher: a prerendered button. The panel (`ChatPanel.vue`) loads on the first open and stays mounted, so an answer keeps arriving while it is closed. `useAiChat().openChat()` opens it from anywhere, which is how the assistant's project card does it. The panel posts to the site's own API (`/api/chat`, streamed as server-sent events, and `/api/chat/feedback`), which passes both to portfolio-ai; the browser never talks to the assistant directly. The logic lives in `app/utils/chat/` as plain TypeScript, so the unit tests run it without Nuxt; the components only render its state.

Things that are easy to break:

- **Answers are rendered from tokens, never as HTML.** `answerText.ts` turns an answer into paragraphs, lists, emphasis and links, and the components build elements from those. Its link grammar is a port of `_LINK` in portfolio-ai's `postprocess.py`, whose link filter decides which URLs a visitor may be sent to; linking anything that pattern does not match would bypass the filter. `tests/unit/linkParity.test.ts` checks the port against a fixture of Python's own matches. When `_LINK` or portfolio-ai's samples change, regenerate the fixture with `tests/unit/fixtures/link-parity.py`, and change `answerText.ts` to match. Only http, https and mailto become links, and never an address with a backslash, which a browser follows as a slash: the filter would have judged a different path from the one the visitor gets.
- **The chat's icons must be listed in `icon.clientBundle.icons`** in `nuxt.config.ts`. The panel is never prerendered, so an icon missing from the client bundle is requested from `/api/_nuxt_icon`, which does not exist in production. The icon scanner drops a misspelt name silently; a misspelt listed name fails the build. `tests/unit/chatIcons.test.ts` fails when the components and the list disagree.
- **Chat components never call `useNavigation()`.** Its `onMounted` scrolls the page to `?section`, or to the top when there is none, so a component that mounts when the panel opens would make the page jump. `ChatLink.vue` follows site links itself.
- **The conversation is kept in `localStorage["portfolio-chat/v1"]`** (`sessionStore.ts`) and resumed within 24 hours of its last question; "New conversation" starts a new session id. A record that fails any check is discarded whole. The old widget's `n8n-chat/sessionId` is removed on load.
- **The copy is the owner's.** The greeting, the suggested questions, and the retention notice ("kept for 90 days") are in `ChatPanel.vue`. The notice has to change if portfolio-ai's `CHAT_RETENTION_DAYS` does, and so does `knowledgebase/projects/portfolio-ai-assistant.md`, which states the 90 days twice.

### The Express API is small

Four routes: `/api/health`; `/api/contact`, rate limited (5 per 15 minutes), optionally verified against reCAPTCHA v3 (score below 0.5 rejected), then forwarded to an n8n webhook; and `/api/chat` and `/api/chat/feedback`, which pass the chat to the AI assistant (the `portfolio-ai` service, private to the Docker network) with its key attached server-side. Missing `RECAPTCHA_SECRET_KEY` disables verification rather than failing, which is intended for local development. Missing `PORTFOLIO_AI_URL` switches the chat routes off (503), and the chat then says the assistant is not available.

`src/server.js` is only the entry point. `src/app.js` builds the app from a config object and never reads the environment, which is what lets the tests build their own on any port; `src/config.js` parses the environment. The chat routes follow the contract in portfolio-ai's `docs/API.md` ("What the proxy has to do"). Things that are easy to break there:

- `/api/chat` streams server-sent events straight through as raw bytes, with no compression and `Cache-Control: no-transform`. A buffering change makes the whole answer arrive at the end; `tests/chat-stream.test.js` fails if it does.
- A visitor who disconnects aborts the upstream request (`res.once("close")`, not `req.on("close")`, which fires as soon as the body has been read). The assistant still finishes and stores the answer.
- `TRUST_PROXY` decides whether `req.ip` is the visitor or Traefik. It is parsed strictly in `config.js`: a hop count must reach Express as a number, since Express reads the string `"2"` as the address 0.0.0.2, and `true` is refused. Unset means every visitor shares one rate-limit bucket and no visitor address is forwarded.
- Nothing a visitor typed goes into a log line, and neither does the error object from a failed body parse, which carries the raw body as `err.body`. Logs are one JSON object per line.

`api/` has its own `package.json` and `node_modules`; the root install does not cover it.

### Environment variables

`NUXT_PUBLIC_*` values are baked into the static bundle **at build time**, so changing them requires a rebuild, and in production they are supplied as Docker build arguments. Server-side settings (`N8N_WEBHOOK_URL`, `N8N_API_KEY`, `RECAPTCHA_SECRET_KEY`, `TRUST_PROXY`, `PORTFOLIO_AI_URL`, `PORTFOLIO_AI_API_KEY`) are read at runtime by the API container from its own `.env`; `api/.env.example` lists and explains them.

## Knowledgebase

`knowledgebase/**/*.md` is **not** part of the build and is never served. It is the corpus for the RAG chat assistant, embedded into PostgreSQL with pgvector **outside this repository**. Changes reach the live assistant only once they are on `main`: the `portfolio-ai` service ingests the folder from GitHub `main` every hour, on the hour, and re-embeds only the articles that changed. Nothing on a branch is indexed.

Because the assistant answers hiring questions, the knowledgebase must not contradict the site. When site copy changes (job titles, project descriptions, achievements, contact details), update the corresponding knowledgebase documents in the same change, and say that the change reaches the assistant within the hour of being pushed to `main`.

Conventions in these files: YAML front matter with `doc_id`, `title`, `page_type`, `url`, `source_type`, `tags`, and `last_verified` (bump it when editing). `url` must point at a page that actually exists. Headings are phrased as questions, which matches how the retrieval layer is queried.

Validate articles with the same parser the ingestion pipeline uses. CI runs it on every push that touches `knowledgebase/**` (`.github/workflows/knowledgebase.yml`). Locally, without Docker: `uvx --from git+https://github.com/mmihaylov94/portfolio-ai portfolio-ai-validate knowledgebase`.

## CV

`public/Mihail_Mihaylov_CV.pdf` is a build artefact of `cv/generate.js`, a self-contained npm project (own `package.json` and lockfile, CommonJS, ignored by the root ESLint). Edit the CV there, never the PDF, and keep its claims consistent with the site and knowledgebase. `cv/README.md` covers fonts, LibreOffice, and the two-page check.

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

Two email addresses are in use deliberately and must not be unified: `m.mihaylov94@gmail.com` for hiring and recruitment, which is the address printed on the CV in `public/`, and `mihaylov.dev@gmail.com` for project and general inquiries. The site's contact section lists both, each with its purpose, so neither is "the address published on the site": describe each by what it is for.
