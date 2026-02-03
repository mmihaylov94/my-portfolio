# Mihail Mihaylov - Portfolio Website

A modern, performant portfolio website built with Nuxt 4, showcasing my work as a Full-Stack Developer & Automation Engineer.

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
- **Package Manager:** pnpm
- **API:** Express (Node.js), forwards to n8n webhooks

## 📁 Project Structure

```
├── api/                      # Express API (chat, contact, feedback → n8n)
│   ├── src/server.js
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

- Node.js 18+
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

Create `.env` with your n8n webhook URLs and reCAPTCHA secret (see Environment variables).

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

The primary deployment uses **Docker** with two services (frontend + API) and Traefik for routing. The frontend is static (Nuxt SSG); the API handles chat, contact, and feedback via n8n webhooks.

The static output (`.output/public/`) can also be deployed to Vercel, Netlify, GitHub Pages, or any CDN if you host the API separately.

### Docker Deployment

Two images: frontend (site) and API. Deployed via `docker compose` with Traefik.

**On the server** – create env files next to `docker-compose.yml`:

| File | Used by | Contents |
|------|---------|----------|
| `.env` | api | `N8N_WEBHOOK_URL`, `N8N_API_KEY`, `RECAPTCHA_SECRET_KEY`, `PORT` |

```bash
docker compose pull
docker compose up -d
```

**CI/CD** – GitHub Actions build and push both images. Add these **repository secrets** for the frontend build:

| Secret | Required | Description |
|--------|----------|-------------|
| `NUXT_PUBLIC_RECAPTCHA_SITE_KEY` | For reCAPTCHA | Site key from [reCAPTCHA Admin](https://www.google.com/recaptcha/admin) |

### API and n8n Webhooks

The API service (`api/`) forwards requests to n8n webhooks. Configure in `.env`:

| Variable | Description |
|----------|-------------|
| `N8N_WEBHOOK_URL` | Base n8n webhook URL |
| `N8N_API_KEY` | API key sent in `apikey` header to n8n webhooks |

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

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking

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

## 📄 License

This project is private and proprietary.

## 👤 Author

**Mihail Mihaylov**

- Website: [mihaylov.io](https://mihaylov.io)
- Email: [mihaylov.dev@gmail.com](mailto:mihaylov.dev@gmail.com)
- LinkedIn: [mihail-mihaylov](https://www.linkedin.com/in/mihail-mihaylov)
- GitHub: [mihaylov-dev](https://github.com/mihaylov-dev)

---

Built with ❤️ using Nuxt 4
