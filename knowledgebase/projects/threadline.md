---
doc_id: project-threadline
title: Threadline
page_type: project
url: https://mihaylov.io/?section=projects
source_type: knowledgebase
tags:
  [
    forum,
    moderation,
    full-stack,
    php,
    postgresql,
    codeigniter-4,
    oauth2,
    recaptcha,
    bootstrap-5,
    quill,
    rag,
  ]
last_verified: 2026-08-13
---

## Summary

Threadline is a **moderated community forum** built as a portfolio-grade full-stack application. It uses **CodeIgniter 4**, **PHP**, and **PostgreSQL**, with **server-rendered pages**, **Bootstrap 5**, and **vanilla JavaScript** (no React or Vue). The focus is **role-based moderation**, **clear accountability**, and a straightforward architecture—not a heavy single-page app.

Public instance: `https://threadline.mihaylov.io`. Repository: `https://github.com/mmihaylov94/threadline`.

## Problem solved

Communities need **structured threads**, **roles and trust levels**, **reporting**, and **moderator workflows** without handing everything to a third-party forum host. Threadline shows how that can work with explicit permissions and an audit trail.

## How it is built (high level)

The application separates **screens and user actions** from **business rules** and **data access**, so features like login, moderation, and reporting stay maintainable. After you sign in, the site remembers who you are for your session. If you try to open something that requires an account, you may be sent to log in first and then returned to what you were viewing.

The interface uses **progressive enhancement**: rich text for posts and replies (**Quill**), **Bootstrap** for layout and dialogs, and the browser’s **local storage** for things like cookie consent and recently viewed threads.

## Technology stack

| Layer | Choices |
| ----- | ------- |
| Runtime | PHP **8.1+** |
| Framework | **CodeIgniter 4** |
| Database | **PostgreSQL** |
| Sign-in with Google | **OAuth 2.0** (Google) |
| Bot protection | **Google reCAPTCHA v3** on sensitive public forms |
| UI | **Bootstrap 5** |
| Rich text | **Quill** (loaded for editing threads and replies) |
| Hosting | **Docker** containers on Mihail's own infrastructure, behind **Traefik** |

## Integrations and third-party services

- **Google Sign-In (optional):** Lets people log in with a Google account instead of a local password. The site verifies the login securely with Google before creating or linking an account.
- **Google reCAPTCHA v3:** Reduces automated abuse on **registration**, **login**, and **password reset** by scoring requests in the background (users generally do not solve a puzzle).
- **Email:** Used to send **email verification** links and **password reset** links for accounts that use email and password. A working mail setup is required for those flows to complete.
- **Newsletter:** Visitors can sign up for updates; subscribers can be kept in sync with account preferences where that option exists.

## Authentication and roles

### Accounts

- **Registration** with email and password, plus **email verification** when enabled.
- **Login** with **email or username** and password.
- **Password reset** via email when you forget your password.
- **Sign in with Google** when the feature is enabled on the deployment.

### Moderation roles

- **Member** — default; can use the forum according to the community rules.
- **Moderator** — can review reports, moderate categories, and take moderation actions on content as designed for the product.
- **Administrator** — can do moderator work plus **user management** (roles, enabling or disabling accounts), with safeguards so an admin cannot lock themselves out by mistake.

### Protections

- Failed **login attempts** are limited: too many failures in a short window temporarily blocks further tries for that identifier.
- Forms use standard web **security practices** (for example CSRF protection on submissions, safe handling of user-generated HTML, and secure connections where configured).

## Core functionality

### Forum

- **Categories** — Browse approved categories. New categories can be **requested** and go through **approval**; moderators and admins can approve, reject, or create categories directly.
- **Threads** — Create threads, open them by link, read **paginated** replies, and **edit or delete** your own threads; moderators can act on others’ threads when needed. Threads can include an optional **background image**. The main thread list shows a fixed number of threads per page (for example **10**).
- **Replies** — Post replies; edit or delete your own; moderators can intervene. Edits by moderators can be **marked** so readers can tell moderator changes from author edits.
- **Search** — Search threads by title and body (case-insensitive).
- **Sorting** — Options such as newest, most replies, latest activity, and top votes (depending on what the deployment exposes).
- **Voting** — Upvotes and downvotes on threads and replies, with scores shown for sorting and display.
- **Favorites** — Save favorite threads; a sidebar can show favorites and **recently viewed** threads.

### Moderation and administration

- A **moderation area** summarizes work such as pending reports and category requests.
- **Reports** can be reviewed one by one or from a **queue**, with actions such as resolve, dismiss, or escalate, and space for notes.
- **Categories** pending approval can be accepted or rejected, sometimes with a reason.
- **Audit logs** record important moderation and system actions for accountability.
- **Admins** can manage **users** (roles and active status) from the user-management part of the admin tools.

### Profiles and settings

- **Public profiles** show community identity (for example display name and avatar where set).
- **Settings** typically include profile fields, **timezone**, **theme** (light, dark, or automatic), notification or marketing preferences where available, **newsletter** alignment, and **password** changes for local accounts.

### Legal, support, and site experience

- Dedicated pages for **Support** (FAQ and contact pointers), **Privacy Policy**, **Terms of Service**, and **Community Guidelines**.
- A **cookie consent** banner and, for logged-out visitors, an optional **newsletter** prompt.
- A tailored **page not found** experience so people are not left on a blank error.

## Planned or not yet available

From the project roadmap: full **in-app notifications**, **draft** posts, **blocking** other users, and **user ranking** based on activity are **not** implemented yet.

## Questions visitors often ask

- **How do I join?** Register with email and password, then complete **email verification** if the site asks for it before you can use your account fully.
- **Can I use Google?** If **Sign in with Google** appears on the login page, you can use it; the first sign-in may create or link your account automatically.
- **I forgot my password.** Use the **forgot password** flow and follow the link sent to your email.
- **How do I report a problem post?** Use the **report** action on a thread or reply, pick at least one **guideline** reason, and submit. Moderators will see it in their tools.
- **What do moderators do?** They review reports, handle category requests, and use the moderation tools they are allowed to use. **Admins** additionally manage user roles and whether accounts are active.

## Links and status

- **Live:** `https://threadline.mihaylov.io`
- **GitHub:** `https://github.com/mmihaylov94/threadline`
- **Status:** Active portfolio project with a public demo and repository.

## Outcome

Threadline demonstrates **secure authentication** (including optional Google sign-in), **bot-resistant public forms**, **role-based access**, **moderation workflows**, **auditability**, and a **clear, maintainable** server-side codebase—useful as a portfolio piece and as a reference for how a moderated forum can be structured.

## How was Threadline engineered?

Threadline is built with CodeIgniter 4 and PostgreSQL, and runs in Docker on Mihail's own infrastructure behind Traefik with automated certificate issuance. It sits alongside his other self-hosted applications on a shared PostgreSQL instance.

## Why did Mihail build Threadline?

Threadline was built to work through the parts of a community platform that are genuinely difficult rather than the parts that are visible: moderation workflow, role-based permissions with safeguards, audit trails, and abuse resistance. The forum itself is the straightforward part.

## What is technically interesting about Threadline?

The moderation system is the substantial piece. Reports carry guideline reasons and move through a queue with resolve, dismiss, and escalate actions. Moderator edits are marked distinctly from author edits so readers can tell them apart. Audit logs record moderation and system actions for accountability. Role management includes safeguards preventing an administrator from removing their own access by mistake.

Abuse resistance is handled with reCAPTCHA scoring on registration, login, and password reset, and email verification before an account is fully usable.

## What technologies does Threadline demonstrate?

CodeIgniter 4, PostgreSQL, Docker, Traefik, Google OAuth, reCAPTCHA, transactional email, and role-based access control. It is Mihail's clearest example of PHP and CodeIgniter work outside his employment, which matters because CodeIgniter is also the framework behind the internal platform he maintains at Businessmap.