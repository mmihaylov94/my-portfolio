# Mihail Mihaylov - Portfolio Website

A modern, performant portfolio website built with Nuxt 4, showcasing my work as a Full-Stack Developer & Automation Engineer.

🌐 **Live Site:** [mihaylov.io](https://mihaylov.io)

## 🚀 Features

- **Static Site Generation (SSG)** - Pre-rendered at build time for optimal performance
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

## 📁 Project Structure

```
app/
├── assets/
│   └── css/
│       └── main.css          # Global styles and theme configuration
├── components/
│   ├── AboutSection.vue      # About section component
│   ├── AppButton.vue         # Reusable button component
│   ├── AppFooter.vue         # Footer component
│   ├── AppHeader.vue         # Navigation header
│   ├── ContactSection.vue    # Contact form section
│   ├── HeroSection.vue       # Hero/landing section
│   ├── ProjectCard.vue       # Project card component
│   ├── ProjectSection.vue    # Projects showcase section
│   ├── SectionDivider.vue    # Section divider component
│   ├── SkillBadge.vue        # Skill badge component
│   └── ThemeToggle.vue       # Dark/light mode toggle
├── composables/
│   └── useProjects.ts        # Projects data composable
├── layouts/
│   └── default.vue           # Default layout
└── pages/
    └── index.vue             # Home page
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10.23.0+ (or npm/yarn)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd my-portfolio
```

2. Install dependencies:

```bash
pnpm install
```

## 💻 Development

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## 🏗️ Building for Production

Build the application for production (generates static files):

```bash
pnpm build
```

The static site will be generated in `.output/public/` directory.

Preview the production build locally:

```bash
pnpm preview
```

## 🚢 Deployment

This site is configured for static site generation (SSG), making it deployable to any static hosting service:

- **Vercel** - Automatic deployments with zero configuration
- **Netlify** - Drag and drop the `.output/public` folder
- **GitHub Pages** - Deploy the static files
- **Cloudflare Pages** - Connect your repository
- **Any CDN** - Serve the static files from `.output/public/`

### Docker Deployment

The project includes Docker configuration for containerized deployment:

```bash
docker build -t portfolio .
docker run -p 80:80 portfolio
```

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
- Email: m.mihaylov94@gmail.com
- LinkedIn: [mihail-mihaylov](https://www.linkedin.com/in/mihail-mihaylov)
- GitHub: [mihaylov-dev](https://github.com/mihaylov-dev)

---

Built with ❤️ using Nuxt 4
