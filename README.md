# Mihail Mihaylov - Portfolio Website

A modern, performant portfolio website built with Nuxt 4, showcasing my work as a Solutions Architect.

🌐 **Live Site:** [mihaylov.io](https://mihaylov.io)

## 🚀 Features

- **Static Site Generation (SSG)** - Pre-rendered at build time for optimal performance
- **AI Chat Popup** - Chat widget powered by n8n webhooks with feedback (thumbs up/down)
- **Contact Form** - With Google reCAPTCHA v3 protection
- **Dark/Light Mode** - System preference detection with manual toggle
- **Responsive Design** - Mobile-first approach with smooth animations
- **SEO Optimized** - Complete meta tags, structured data (JSON-LD), and Open Graph support
- **Performance Optimized** - Font preloading, optimized CSS loading, and minimal JavaScript
- **Modern UI** - Built with Nuxt UI and Tailwind CSS

## 🛠️ Tech Stack

- **Framework:** [Nuxt 4](https://nuxt.com/)
- **UI Library:** [Nuxt UI](https://ui.nuxt.com/)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Package Manager:** npm
- **API:** Express (Node.js): the contact form's n8n webhook, and the proxy to the AI assistant

## 📁 Project Structure

```
├── api/                      # Express API: contact form, and the AI assistant's proxy
│   ├── src/
│   │   ├── server.js         # Entry point: reads the environment, listens, stops cleanly
│   │   ├── app.js            # The app, built from a config object (what the tests use)
│   │   ├── config.js         # Environment parsing, including TRUST_PROXY
│   │   ├── chat.js           # /api/chat and /api/chat/feedback → portfolio-ai
│   │   ├── contact.js        # /api/contact → n8n webhook
│   │   └── http.js           # Rate limits, errors, logging
│   ├── tests/                # node --test
│   ├── .env.example
│   └── Dockerfile
├── app/
│   ├── assets/css/main.css   # Global styles and theme configuration
│   ├── components/
│   │   ├── AiChatPopup.vue   # AI chat widget (bottom-right)
│   │   ├── AboutSection.vue
│   │   ├── AppButton.vue
│   │   ├── AppFooter.vue
│   │   ├── AppHeader.vue
│   │   ├── ContactSection.vue
│   │   ├── HeroSection.vue
│   │   ├── ProjectCard.vue
│   │   ├── ProjectSection.vue
│   │   ├── SectionDivider.vue
│   │   ├── SkillBadge.vue
│   │   └── ThemeToggle.vue
│   ├── composables/
│   │   ├── useAbout.ts
│   │   ├── useNavigation.ts
│   │   ├── useProjects.ts
│   │   └── useRecaptcha.ts   # reCAPTCHA v3 for contact form
│   ├── layouts/default.vue
│   └── pages/index.vue
├── docker-compose.yml        # Site + API services
└── Dockerfile                # Frontend (Nuxt SSG → nginx)
```

## 🚦 Getting Started

### Prerequisites

- Node.js 20.19 or newer (the API image runs Node 20)
- npm

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd my-portfolio
```

2. Install dependencies:

```bash
npm install
```

## 💻 Development

The frontend runs on port **3001**, the API on port **3000**. For full functionality (chat, contact, feedback), run both:

**Terminal 1 – Frontend:**
```bash
npm run dev
```
Opens at `http://localhost:3001`. Nuxt proxies `/api/*` to the API.

**Terminal 2 – API:**
```bash
cd api && npm run dev
```

Copy `api/.env.example` to `api/.env` and fill in what you need: the n8n webhook and reCAPTCHA secret for the contact form, and `PORTFOLIO_AI_URL` and `PORTFOLIO_AI_API_KEY` for the chat. The chat needs the [portfolio-ai](https://github.com/mmihaylov94/portfolio-ai) API running locally (`uv run python -m portfolio_ai.api`, on port 8000) with the same key. With `PORTFOLIO_AI_URL` empty, the chat routes answer 503.

**API tests:**
```bash
cd api && npm test
```

## 🏗️ Building for Production

Build the application for production (generates static files):

```bash
npm run build
```

The static site will be generated in `.output/public/` directory.

Preview the production build locally:

```bash
npm run preview
```

## 🚢 Deployment

The primary deployment uses **Docker** with two services (frontend + API) and Traefik for routing. The frontend is static (Nuxt SSG). The API handles the contact form through an n8n webhook, and passes the chat and its feedback to the AI assistant (`portfolio-ai`), which is private to the Docker network.

The static output (`.output/public/`) can also be deployed to Vercel, Netlify, GitHub Pages, or any CDN if you host the API separately.

### Docker Deployment

Two images: frontend (site) and API. Deployed via `docker compose` with Traefik.

**On the server** – create env files next to `docker-compose.yml`:

| File | Used by | Contents |
|------|---------|----------|
| `.env` | api | `N8N_WEBHOOK_URL`, `N8N_API_KEY`, `RECAPTCHA_SECRET_KEY`, `PORT`, `TRUST_PROXY`, `PORTFOLIO_AI_URL`, `PORTFOLIO_AI_API_KEY` (see `api/.env.example`) |

```bash
docker compose pull
docker compose up -d
```

**CI/CD** – GitHub Actions build and push both images. Add these **repository secrets** for the frontend build:

| Secret | Required | Description |
|--------|----------|-------------|
| `NUXT_PUBLIC_RECAPTCHA_SITE_KEY` | For reCAPTCHA | Site key from [reCAPTCHA Admin](https://www.google.com/recaptcha/admin) |

### API

The API service (`api/`) has three routes besides `/api/health`:

| Route | Goes to | Limit per visitor |
|-------|---------|-------------------|
| `POST /api/contact` | the n8n contact webhook | 5 per 15 minutes |
| `POST /api/chat` | the assistant's `/v1/chat/stream`, streamed back as server-sent events | 60 per 15 minutes |
| `POST /api/chat/feedback` | the assistant's `/v1/messages/{id}/feedback` | 30 per 15 minutes |

Configure in `.env`:

| Variable | Description |
|----------|-------------|
| `N8N_WEBHOOK_URL` | Base n8n webhook URL |
| `N8N_API_KEY` | API key sent in `apikey` header to n8n webhooks |
| `PORTFOLIO_AI_URL` | The assistant's address on the Docker network. Empty keeps the chat routes switched off (503). |
| `PORTFOLIO_AI_API_KEY` | Identical to the assistant's own `PORTFOLIO_AI_API_KEY`; never sent to the browser |
| `TRUST_PROXY` | How many proxies sit in front of the API (Traefik, then Cloudflare), so the limits are per visitor. Unset means one shared bucket for everyone. |

The chat routes follow the contract in [portfolio-ai's docs/API.md](https://github.com/mmihaylov94/portfolio-ai/blob/main/docs/API.md), and never write anything a visitor typed to the log.

### reCAPTCHA (Contact Form)

The contact form uses Google reCAPTCHA v3 (invisible, badge bottom-left). Get keys from [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin).

| Variable | Where | Description |
|----------|-------|-------------|
| `NUXT_PUBLIC_RECAPTCHA_SITE_KEY` | GitHub secret (build) | Site key (public), baked into frontend at build time |
| `RECAPTCHA_SECRET_KEY` | `.env` | Secret key (private) |

If reCAPTCHA keys are not set, the contact form works without verification (useful for local dev).

## ⚡ Performance Optimizations

- **Static Site Generation** - All pages are pre-rendered at build time
- **Font Optimization** - Google Fonts loaded via preconnect and link tags (not @import)
- **CSS Optimization** - Critical styles loaded inline to prevent FOUC
- **Route Prerendering** - All routes automatically discovered and prerendered

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `cd api && npm test` - Run the API's tests

## 🎨 Customization

### Theme Colors

Edit `app/assets/css/main.css` to customize the color palette:

- Primary colors: Warm Beige/Peach (#ECCAA4, #e4b88a)
- Secondary colors: Warm Teal-Blue (#7BB5CC)

The color palette uses Tailwind CSS v4's `@theme` directive for theme configuration. Both primary and secondary colors have full 50-950 shade palettes for consistent theming across light and dark modes.

### Fonts

Fonts are configured in `nuxt.config.ts` and `app/assets/css/main.css`:

- Primary font: Teachers
- Secondary font: Cantarell

### Logo

The site uses an SVG logo (`public/logo.svg`) that:

- Automatically adapts to light/dark mode using CSS media queries
- Serves as the favicon with built-in dark mode support
- Uses the primary color palette for consistent branding

## 👤 Author

**Mihail Mihaylov**

- Website: [mihaylov.io](https://mihaylov.io)
- Email: [mihaylov.dev@gmail.com](mailto:mihaylov.dev@gmail.com)
- LinkedIn: [mihail-m-mihaylov](https://www.linkedin.com/in/mihail-m-mihaylov)
- GitHub: [mmihaylov94](https://github.com/mmihaylov94)

---