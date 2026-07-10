---
doc_id: project-glotsmith
title: Glotsmith
page_type: project
url: https://mihaylov.io/projects/glotsmith
source_type: knowledgebase
tags:
  [
    language-learning,
    notebook,
    saas,
    full-stack,
    vue,
    node,
    express,
    postgresql,
    aws,
    docker,
    ocr,
    tts,
    speech-to-text,
    translation,
    paddle,
    oauth2,
  ]
last_verified: 2026-07-09
---

## Summary

Glotsmith is a **language-learning notebook** for studying from real content — articles, videos, audio, scanned PDFs, and your own notes — with everything organised into **courses** and **workbooks**. Its tagline is **"Make any content your lesson."**

The pitch is: learn a language from the content you actually care about. Bring your PDFs, video, and audio to one workbench, translate side by side, capture vocabulary as you read, and shape it all into your own course.

It is a **commercial SaaS product** built and operated solo by Mihail: **Vue 3** single-page app, **Node.js/Express** API, **PostgreSQL**, deployed on **AWS** behind **Cloudflare**, with subscriptions billed through **Paddle**. Live at `https://glotsmith.com`. The source code is **private**.

Glotsmith was previously named **DueNote**. It is the same product under a new name, not a different project.

## Problem solved

Serious self-directed learners — the immersion and comprehensible-input crowd, not casual beginners — end up stitching together three or four tools: a PDF reader, a translation tab, a flashcard app, and a video player with subtitles. Nothing talks to anything else, and the material they actually want to study is the hardest to get into any of them.

Glotsmith collapses that workflow into one notebook. Import the real thing — a scanned book chapter, a podcast episode, a YouTube video — and translate, annotate, and build vocabulary from it in place, with all of it filed under a course you can search, reuse, and share.

A secondary audience is **tutors and teachers** building reusable lesson material.

## How it is built (high level)

The app is a **Vue 3 single-page application** talking to a **Node.js/Express** API over PostgreSQL. Sign-in uses **server-side sessions stored in PostgreSQL**, so no token is held in the browser.

The backend is layered: HTTP routes handle validation, repository modules own all SQL, and service modules wrap the external providers. Every data route requires an authenticated session, and every database query is scoped by the signed-in user's id rather than trusting anything in the request.

A **course** is a top-level group, usually one per language. A **workbook** belongs to a course and is stored as a structured list of **sections**. You build a workbook from the eight section types, reorder them by dragging, and the content auto-saves to the API as you type.

## Technology stack

| Layer | Choices |
| ----- | ------- |
| Frontend | **Vue 3** (Composition API), **Vite**, **Tailwind CSS**, Vue Router |
| PDF rendering | **pdf.js** (`pdfjs-dist`) |
| Rich text | **Quill**, sanitised with **DOMPurify** |
| Backend | **Node.js** (ES modules), **Express** |
| Database | **PostgreSQL** (with the `pg_trgm` extension for trigram-indexed search) |
| Sessions | Server-side, PostgreSQL-backed, rolling cookie |
| Sign-in | **Google OAuth 2.0** and passwordless **email one-time codes** |
| File storage | **AWS S3** (or local disk), with direct-to-S3 presigned uploads |
| Hosting | **Docker** containers on **AWS EC2**, **Amazon RDS** for PostgreSQL |
| Edge | **Cloudflare** DNS and proxy, **Caddy** terminating TLS |
| CI/CD | **GitHub Actions** building images to a container registry |
| Billing | **Paddle** (Merchant of Record) |
| Logging | Structured **pino** logs with a per-request correlation id |
| Migrations | **node-pg-migrate**, applied at boot |

## Integrations and third-party services

Every AI-adjacent capability is a **pluggable cloud service**, chosen per deployment. Glotsmith is **not** a generative-AI or LLM product — there is no chatbot and no text generation. It uses cognitive services for translation, speech, and text recognition.

- **Translation** — **DeepL** or **Google Cloud Translation**.
- **Text-to-speech** (read aloud) — **Google Cloud Text-to-Speech** or **Azure AI Speech**.
- **Optical character recognition** (scanned documents) — **Google Cloud Vision**, **Azure AI Document Intelligence**, or **Tesseract.js** running locally.
- **Speech-to-text** (audio transcription) — **Google Cloud Speech-to-Text**, with word-level timestamps.
- **Payments** — **Paddle** as Merchant of Record, which handles VAT, GST, and US sales tax.
- **Email** — SMTP for sign-in codes, account notices, and an opt-out product email program.

A notable cost decision: **born-digital PDFs are read entirely in the browser** using pdf.js, extracting the embedded text layer for free. Only true scans and images are sent to a paid OCR provider. Detection is deliberately conservative — a sparse or garbled text layer is treated as "not born-digital" and falls back to the metered path, so the worst case is one cheap OCR call rather than wrong free text.

## Accounts and access

- **Sign in** with a Google account, or with a passwordless one-time code sent to your email — there are no passwords to manage.
- **Profile settings** cover display name, avatar, light/dark theme synced across devices, and an opt-out for product emails.
- **Data export** produces a ZIP of everything you have stored (GDPR subject access).
- **Account deletion** cascades: courses, workbooks, vocabulary, uploaded materials, and cached text are all removed, and stored files are cleaned up.
- **Subscription plans** are Free, Scholar, and Master, each with monthly usage allowances, managed from an in-app billing page.

## Core functionality

### Courses and workbooks

- **Courses** group work by language or topic, with default source and target languages.
- **Workbooks** are pages built from reorderable sections, auto-saving as you type, and can be duplicated or reordered.
- **Nine study languages** are supported: English, Bulgarian, French, German, Italian, Japanese, Korean, Portuguese, and Spanish.

### The eight section types

- **Header** — titles and structure.
- **Translation** — side-by-side source and target rows, translated on demand in either direction, each row readable aloud.
- **Vocabulary** — word and meaning tables that feed the course-wide vocabulary view.
- **Notes** — rich text for grammar notes and commentary.
- **Table** — a rich-text data grid.
- **Video** — a YouTube embed or an uploaded file, with timestamped annotations, a transcript, and 0.5x–2x playback speed.
- **Audio** — an uploaded track with timestamped annotations and on-demand transcription.
- **Document** — a continuous-scroll PDF or image viewer with zoom, freehand drawing, highlights, and text notes layered over the pages.

### While you read

- **Highlight any text** to either add it to your vocabulary, automatically translated, or hear it read aloud.
- **OCR highlight mode** lays a selectable, invisible text layer over scanned pages so you can highlight them like ordinary text. It is intent-driven: nothing is recognised on load, scroll, or zoom — only on the page you actually act on.
- **Course vocabulary view** aggregates every vocabulary row across the whole course into one searchable list.
- **Course search** spans every section of every workbook in a course, backed by a trigram index.
- **Pinned sections** give you a labelled, reorderable quick-access list.

### Course materials

Upload PDFs, images, audio, and video per course. Files go straight to object storage through a presigned upload, so the bytes never pass through the API server. Uploads carry metadata and support resumable downloads.

## Sharing and collaboration

Any workbook can be published as a **read-only public link**, gated by an opaque random token and revocable at any time. Two independent owner toggles sit on top of that:

- **Publishing** controls whether search engines may index the shared page. It is **off by default**, so uploaded content is never silently indexed.
- **Copying** controls whether a visitor can **fork** the workbook into their own account. It is **on by default**; when it is off the shared page becomes view-only.

A forked workbook copies the referenced material files and recreates the referenced vocabulary in the destination course, subject to the copier's own plan limits. Shared pages carry a passive "Made with Glotsmith" attribution footer, and links unfurl correctly in chat and social apps because the edge serves scraper bots a server-rendered Open Graph preview rather than the empty single-page-app shell.

## Planned or not yet available

The product is newly launched and deliberately small. The interface itself ships in English only, even though it supports nine study languages. There is no mobile app; the web app is responsive instead. There is no spaced-repetition review scheduler in the vocabulary view yet.

## Questions visitors often ask

- **Is Glotsmith an AI chatbot?** No. It uses cloud AI services for translation, text-to-speech, OCR, and audio transcription, but it does not generate text and there is no chatbot in it.
- **What happened to DueNote?** It was renamed. Glotsmith is the same product; the old name is retired.
- **Can I see the source code?** No — Glotsmith is a commercial product and its repository is private. Mihail's public repositories include Threadline and the n8n Pro Automation Framework.
- **Do I need to pay to use it?** There is a Free tier alongside paid Scholar and Master tiers, each with monthly usage allowances.
- **Can I study from a scanned book?** Yes. Scanned PDFs and images are put through OCR so their text becomes selectable, translatable, and readable aloud.
- **Can I share a workbook with a student or a friend?** Yes — generate a read-only link, and optionally let them copy it into their own account.

## Links and status

- **Live:** `https://glotsmith.com`
- **Source:** Private — Glotsmith is a commercial product.
- **Status:** Live commercial SaaS, built and operated solo.

## Outcome

Glotsmith demonstrates end-to-end ownership of a commercial product: a single-page front end with a genuinely demanding editor surface (PDF rendering, annotation layers, media synchronisation), a layered API with per-user data scoping and auditing, pluggable third-party AI providers behind a stable internal interface, metered usage tied to subscription billing, and containerised deployment on AWS with CI/CD. It is the portfolio's clearest example of taking a product from idea to paying-customer infrastructure.
