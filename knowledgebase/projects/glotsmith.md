---
doc_id: project-glotsmith
title: Glotsmith
page_type: project
url: https://mihaylov.io/case-studies/glotsmith
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
    typescript,
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
last_verified: 2026-09-23
---

## Summary

Glotsmith is **one place for your language course materials** and the tools to study them, with everything organised into **courses** and **workbooks**. Its tagline is **"One place for your course materials."**

The pitch: upload the files your language course gives you and keep them together, then study them on the page. Translate a word, hear it read aloud, take notes, and build one word list for the whole course. Glotsmith does not teach; the course does. Glotsmith is where the course's materials, or material the learner already owns, are kept and studied.

It is a **commercial SaaS product** built and operated solo by Mihail: a **Vue 3** single-page app and a **Node.js/Express** API, both written in **TypeScript**, over **PostgreSQL**, deployed on **AWS** behind **Cloudflare**, with subscriptions billed through **Paddle**. Live at `https://glotsmith.com`, with public registration open since 2 September 2026. The source code is **private**.

Glotsmith was previously named **DueNote**. It is the same product under a new name, not a different project.

## Problem solved

Glotsmith is for **adults taking a language course**, whether online, at a language school, or at university, who receive their study material as files: PDFs, photos of pages, audio, and video. It also suits learners studying from material they already own, such as a coursebook and its audio. Someone starting from scratch, with nothing to read or listen to, is better served by an app with built-in lessons.

Course material usually ends up scattered across a PDF reader, a translation tab, a vocabulary notebook, and a media player, and nothing talks to anything else. Glotsmith collapses that into one place: upload the course's files, then translate, annotate, listen, and build vocabulary from them in place, with everything filed under a course you can search, reuse, and share.

## How it is built (high level)

The app is a **Vue 3 single-page application** talking to a **Node.js/Express** API over PostgreSQL. Both are written in **TypeScript**: the migration was completed on 28 August 2026, and the backend runs directly on Node 22 with no build step. Sign-in uses **server-side sessions stored in PostgreSQL**, so no token is held in the browser.

The backend is layered: HTTP routes handle validation, repository modules own almost all SQL, and service modules wrap the external providers. Every data route requires an authenticated session, and every database query is scoped by the signed-in user's id rather than trusting anything in the request.

A **course** is a top-level group, usually one per language. A **workbook** belongs to a course and is stored as a structured list of **sections**. You build a workbook from the eight section types, reorder them by dragging, and the content auto-saves to the API as you type.

## Technology stack

| Layer | Choices |
| ----- | ------- |
| Frontend | **Vue 3** (Composition API) in **TypeScript**, **Vite**, **Tailwind CSS**, Vue Router |
| PDF rendering | **pdf.js** (`pdfjs-dist`) |
| Rich text | **Quill**, sanitised with **DOMPurify** |
| Backend | **Node.js** 22 running **TypeScript** directly, with no build step, and **Express** |
| Database | **PostgreSQL** |
| Sessions | Server-side, PostgreSQL-backed, rolling cookie |
| Sign-in | **Google OAuth 2.0** and passwordless **email one-time codes** |
| File storage | **AWS S3** (or local disk), with direct-to-S3 presigned uploads |
| Hosting | **Docker** containers on **AWS EC2**, **Amazon RDS** for PostgreSQL |
| Edge | **Cloudflare** DNS and proxy, **Caddy** terminating TLS |
| CI/CD | **GitHub Actions** building images to GitHub Container Registry; a scripted release deploys them |
| Billing | **Paddle** (Merchant of Record) |
| Logging | Structured **pino** logs with a per-request correlation id |
| Migrations | **node-pg-migrate**, run by the deploy script after an automatic database snapshot |

The full case study is at `https://mihaylov.io/case-studies/glotsmith`. Compliance is part of this project rather than a separate one, and is covered below.

## Integrations and third-party services

Every AI-adjacent capability sits behind a **pluggable provider layer**. Glotsmith is **not** a generative-AI or LLM product: there is no chatbot and no text generation. It uses cognitive services for translation, speech, and text recognition, and in production all four come from **Google Cloud**.

- **Translation**: **Google Cloud Translation**.
- **Text-to-speech** (read aloud): **Google Cloud Text-to-Speech**.
- **Optical character recognition** (scanned documents): **Google Cloud Vision**.
- **Speech-to-text** (audio transcription): **Google Cloud Speech-to-Text**, with word-level timestamps.
- **Payments**: **Paddle** as Merchant of Record, which handles VAT, GST, and US sales tax.
- **Email**: **Amazon SES** for sign-in codes and account notices. Product emails are opt-in and off by default.

Alternative providers are implemented but switched off in production: **DeepL** for translation, **Azure AI Speech** for text-to-speech, and **Azure AI Document Intelligence** or **Tesseract.js**, running on the server, for OCR.

A notable cost decision: **born-digital PDFs are read entirely in the browser** using pdf.js, extracting the embedded text layer for free. Only true scans and images are sent to the paid OCR provider. Detection is deliberately conservative: a page whose text layer has fewer than 100 characters or 16 words is treated as a scan and falls back to the metered path, so the worst case is one cheap OCR call rather than missing text.

## Accounts and access

- **Sign in** with a Google account, or with a passwordless one-time code sent to your email — there are no passwords to manage.
- **Profile settings** cover display name, avatar, light/dark theme synced across devices, and an opt-in for product emails, which is off by default.
- **Data export** produces a ZIP of everything you have stored (GDPR subject access).
- **Account deletion** cascades: courses, workbooks, vocabulary, uploaded materials, and cached text are all removed, and stored files are cleaned up.
- **Subscription plans** are Free, Scholar, and Master, each with monthly usage allowances, managed from an in-app billing page.

## Core functionality

### Courses and workbooks

- **Courses** group work by language or topic, with default source and target languages.
- **Workbooks** are pages built from reorderable sections, auto-saving as you type, and can be duplicated or reordered.
- **Eight study languages** are available: English, French, German, Italian, Japanese, Korean, Portuguese, and Spanish. Bulgarian is also supported but is currently limited to administrators.

### The eight section types

- **Header** — titles and structure.
- **Translation** — side-by-side source and target rows, translated on demand in either direction, each row readable aloud.
- **Vocabulary** — word and meaning tables that feed the course-wide vocabulary view.
- **Notes** — rich text for grammar notes and commentary.
- **Table** — a rich-text data grid.
- **Video** — a YouTube embed or an uploaded file, with timestamped annotations. Uploaded files also get a transcript and 0.5x to 2x playback speed; a YouTube video uses YouTube's own player, loads only after a consent click, and cannot be transcribed.
- **Audio** — an uploaded track with timestamped annotations and on-demand transcription, capped at 6 minutes per transcription.
- **Document** — a continuous-scroll PDF or image viewer with zoom, freehand drawing, highlights, and text notes layered over the pages.

### While you read

- **Highlight text** to translate it inline, add it to your vocabulary (automatically translated), or hear it read aloud. This works everywhere except inside Translation and Vocabulary sections and on shared links.
- **OCR highlight mode** lays a selectable, invisible text layer over scanned pages so you can highlight them like ordinary text. It is intent-driven: nothing is recognised on load, scroll, or zoom — only on the page you actually act on.
- **Course vocabulary view** aggregates every vocabulary row across the whole course into one searchable list.
- **Course search** spans every section of every workbook in a course, backed by derived search tables that make it a single indexed SQL query.
- **Pinned sections** give you a labelled, reorderable quick-access list.

### Course materials

Upload PDFs, images (JPG, PNG, or WebP), audio, and video per course. Word and plain-text files can be uploaded too; they are stored with the course but do not open inside Glotsmith. Files go straight to object storage through a presigned upload, so the bytes never pass through the API server. Uploads carry metadata and support resumable downloads.

## Sharing and collaboration

Any workbook can be published as a **read-only public link**, gated by an opaque random token and revocable at any time. Two independent owner toggles sit on top of that:

- **Publishing** controls whether search engines may index the shared page. It is **off by default**, so uploaded content is never silently indexed.
- **Copying** controls whether a visitor can **fork** the workbook into their own account. It is **on by default**; when it is off the shared page becomes view-only.

A forked workbook copies the referenced material files and recreates the referenced vocabulary in the destination course, subject to the copier's own plan limits. Shared pages carry a passive "Made with Glotsmith" attribution footer, and links unfurl correctly in chat and social apps because the web server (Caddy) serves scraper bots a server-rendered Open Graph preview rather than the empty single-page-app shell.

## Planned or not yet available

The product is live at `https://glotsmith.com` and deliberately small in scope. The interface itself ships in English only, even though it supports eight study languages. There is no mobile app; the web app is responsive and can be installed to a phone's home screen. There is no spaced-repetition review scheduler in the vocabulary view yet, and Glotsmith does not work offline.

## When did Glotsmith launch?

Glotsmith went live at `https://glotsmith.com` on 18 August 2026, and public registration opened on 2 September 2026. It took roughly six months to build: about two months for the product Mihail wanted for his own language course, and about four more to make it something a stranger could pay for.

## How much does Glotsmith cost?

There are three plans, priced in US dollars and excluding tax, which Paddle adds at checkout as Merchant of Record:

- **Free**: no time limit and no credit card needed. One course, five workbooks, and every study tool, with a monthly allowance.
- **Scholar**: $12 a month, or $119 a year.
- **Master**: $24 a month, or $239 a year, with the highest monthly limits and storage.

Every plan has monthly usage allowances for translation, read-aloud, transcription, and OCR. Consumers in the EU and EEA can withdraw within 14 days of subscribing for a full refund. Current details are on the pricing page at `https://glotsmith.com/pricing`.

## Who can use Glotsmith?

Glotsmith is for adults: users must be at least 18 years old. It is available internationally, except that it is not currently offered to people located or ordinarily resident in the United Kingdom or in Quebec, Canada, or in jurisdictions under comprehensive sanctions. It runs in a web browser on a computer, tablet, or phone, with nothing to install.

## Questions visitors often ask

- **Is Glotsmith an AI chatbot?** No. It uses cloud AI services for translation, text-to-speech, OCR, and audio transcription, but it does not generate text and there is no chatbot in it.
- **What happened to DueNote?** It was renamed. Glotsmith is the same product; the old name is retired.
- **Can I see the source code?** No. Glotsmith is a commercial product and its repository is private. Mihail's public repositories include Threadline and the lite edition of the n8n Pro Automation Framework.
- **Do I need to pay to use it?** No. There is a Free plan with no credit card needed, alongside paid Scholar ($12 a month) and Master ($24 a month) plans, each with monthly usage allowances.
- **Can I study from a scanned book?** Yes. Scanned PDFs and images are put through OCR so their text becomes selectable, translatable, and readable aloud.
- **Can I share a workbook with a student or a friend?** Yes — generate a read-only link, and optionally let them copy it into their own account.

## What were the hardest engineering problems in Glotsmith?

**Search across unstructured workbook content.** Workbook bodies are stored as JSON. Three interactive endpoints needed to read inside that JSON, and each was loading an entire course's content into memory, parsing it, and scanning it on the event loop, with pagination applied only after everything had been parsed. Mihail solved this with derived tables rebuilt transactionally on every workbook write, turning search into a single indexed SQL query with database-side pagination. The fix introduced a write-amplification problem, which he caught and solved with a signature check that skips the rebuild entirely when nothing relevant has changed.

**Metering paid AI providers correctly.** Every OCR page, translation, and speech request costs real money at a third-party provider. Quota was counted in words, but providers bill in characters, and a five thousand character string with no spaces counts as a single word. A free account could have consumed millions of provider characters against a thousand-word allowance. The fix keeps words as the user-facing unit, because that is the honest unit for a language product, and re-prices only abnormally long tokens.

**Preventing double-billing on concurrent requests.** Two simultaneous requests for the same uncached page would both pay for the same OCR call. The first fix used a database advisory lock, which was correct in principle but held a pooled database connection across a multi-second external call, so a burst of traffic would have exhausted the connection pool. Mihail reverted it and replaced it with an in-process lock that re-checks the cache once acquired, so the second request finds the result already there.

## Did Mihail measure performance in Glotsmith, or just assume it?

He measured, and deleted several of his own database indexes as a result.

A trigram index was added to accelerate in-course search. Running `EXPLAIN ANALYZE` against a seeded table of 50,000 sections across 500 courses showed the query planner never chose it, because the query always filters on course first and the plain index on that column is always cheaper. The index cost real time on every save and delivered nothing on reads, so a migration dropped it. A second index was measured the same way, found to be more expensive than the sequential scan it was meant to replace, and dropped as well.

## What infrastructure does Glotsmith run on?

Glotsmith runs on AWS. A single EC2 instance runs Docker Compose behind Cloudflare, with Amazon RDS for PostgreSQL, S3 for file storage, and SES and SNS for email and bounce handling. S3 access uses an IAM instance role rather than static access keys; email goes through SES with SMTP credentials. GitHub Actions builds the images and pushes them to GitHub Container Registry with per-commit tags. A scripted release then deploys them, taking an automated database snapshot before any migration, with a scripted rollback. Staging and production are separate environments.

The database has point-in-time recovery, and Mihail rehearsed the restore rather than assuming it worked: a point-in-time restore into a throwaway instance, verified for tables, row counts, and migration history, then torn down.

## What infrastructure did Mihail reject for Glotsmith, and why?

Aurora Serverless was rejected because continuous connections and daily scheduled jobs mean it never actually pauses, so the savings are illusory while cold-start risk is real. Managed container platforms with scale-to-zero were rejected because scale-to-zero breaks scheduled work. Kubernetes was rejected as heavily over-engineered at this scale. A cheap bare VPS was rejected for the opposite reason: without a managed database he would own backups and point-in-time recovery himself, which was the responsibility he most wanted to avoid holding alone.

Redis was also deliberately avoided. Sessions live in PostgreSQL and scheduled jobs elect a leader through a database advisory lock, so the application can scale horizontally later without adding a component now.

## Why did Glotsmith move from Stripe to Paddle?

The decision was commercial and legal rather than technical, and it is the mistake that cost Mihail the most time.

The original plan was a limited company taking payments through Stripe, and the Stripe integration was fully built and tested. Working out the real cost of running a limited company before having any customers made that structure disproportionate, so he restructured as a self-employed professional. That change invalidated the payment integration, because invoicing as a freelancer did not work the way the Stripe setup assumed and the accountancy costs the restructure was meant to avoid would have returned through the payment model.

The answer was Paddle as a Merchant of Record. A Merchant of Record is the seller rather than a payment processor, so VAT, sales tax, and invoicing become Paddle's obligation. There is no tax configuration in the application at all, which for a product selling into both the EU and US is worth more than any billing code.

The lesson Mihail draws from it: decide the legal and commercial structure before writing the code that depends on it, because the structure determines the architecture rather than the other way round.

## How is Glotsmith tested?

As of September 2026, roughly 98,000 lines of production TypeScript sit behind a test suite of around 92,000 lines, with an 85% line coverage gate enforced in continuous integration for both the backend and the frontend. Tests run at four levels: backend unit tests using the Node.js built-in test runner, integration tests using supertest, frontend unit and Vue component tests using Vitest, and end-to-end tests in Playwright. Automated accessibility checks with axe run inside the Playwright suite.

## How does Glotsmith handle legal compliance?

Glotsmith implements GDPR, EU Digital Services Act, CCPA, and DMCA obligations in code and database schema rather than only in published documents.

The principle Mihail works to is that a published privacy policy is not a document but a set of factual claims about a running system, and nothing in an ordinary codebase stops those claims quietly becoming false. So data retention limits are enforced by scheduled sweeps, with the retention of checkout consent records hard-capped in code at the published five years. The terms version stamped on consent records is pinned by a test to the effective date printed in the terms, and a test fails continuous integration if a legal document renders with an unfilled field.

Data processing agreements are in place with all five processors in use: Google, AWS, Cloudflare, Zoho, and Paddle. Consent records were migrated to explicit lawful bases. Copyright takedown is a shipped subsystem with a registered DMCA agent, a durable strike ledger, a soft-disable, a section 512(g) counter-notice put-back flow, and a litigation hold. Consumers in the EU and EEA have a 14-day right of withdrawal with a full refund.

## Links and status

- **Live:** `https://glotsmith.com`
- **Source:** Private — Glotsmith is a commercial product.
- **Status:** Live commercial SaaS, built and operated solo. The site went live on 18 August 2026, and public registration opened on 2 September 2026.

## Outcome

Glotsmith demonstrates end-to-end ownership of a commercial product: a single-page front end with a genuinely demanding editor surface (PDF rendering, annotation layers, media synchronisation), a layered API with per-user data scoping and auditing, pluggable third-party AI providers behind a stable internal interface, metered usage tied to subscription billing, and containerised deployment on AWS with CI/CD. It is the portfolio's clearest example of taking a product from idea to paying-customer infrastructure.
