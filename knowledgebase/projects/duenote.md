---
doc_id: project-duenote
title: DueNote
page_type: project
url: https://mihaylov.io/projects/duenote
source_type: knowledgebase
tags:
  [
    language-learning,
    notebook,
    productivity,
    full-stack,
    vue,
    node,
    express,
    postgresql,
    deepl,
    oauth2,
  ]
last_verified: 2026-04-06
---

## Summary

DueNote is a **language-learning notebook** for studying from real content (articles, videos, and notes) while keeping everything organised into **courses**, **workbooks**, and **reorderable sections**. It auto-saves as you type, supports translation blocks via a backend proxy, and provides a course-wide aggregated vocabulary view.

## Problem Solved

Most language study workflows end up scattered across browser tabs, documents, and flashcard apps. DueNote keeps learning materials, translations, grammar notes, and vocabulary in one place, structured for review and reuse.

## Solution

- **Courses & workbooks**: courses per language/topic; workbooks per lesson/article/video.
- **Section-based workbook pages**: header, translation, vocabulary, grammar notes (rich text), and YouTube video embeds.
- **Auto-save**: debounced saves to the API while editing.
- **Vocabulary building**: highlight text and add it to a workbook vocabulary section with an automatic translation.
- **Course vocabulary view**: aggregates vocabulary across all workbooks in a course (search + filtering).

## Technology stack

- **Frontend**: Vue 3, Vue Router, Vite, Tailwind CSS, Quill (`@vueup/vue-quill`)
- **Backend**: Node.js (ES modules), Express
- **Database**: PostgreSQL
- **Auth**: server-side sessions (PostgreSQL-backed), optional Google OAuth
- **Integration**: DeepL API (via backend proxy)

## Outcome

Transforms real learning materials into structured, searchable notes with built-in translation and vocabulary capture.

## Links and status

- **Live**: `https://duenote.mihaylov.io`
- **GitHub**: `https://github.com/mmihaylov94/duenote`
- **Status**: Active portfolio project

