---
doc_id: project-site-ai-assistant
title: This Site's AI Assistant
page_type: project
url: https://mihaylov.io/projects/site-ai-assistant
source_type: knowledgebase
tags: [ai, rag, pgvector, n8n, nuxt, typescript, ai-agents, tool-calling]
last_verified: 2026-08-13
---

## Summary

The AI assistant on `mihaylov.io` is a retrieval-augmented chat assistant that answers questions about Mihail's work from a curated markdown knowledge base. It is the chat widget in the bottom-right corner of the site, and it introduces itself as Rachel.

## Problem Solved

Visitors, including recruiters and hiring managers, want specific answers about experience, stack, and projects without reading an entire portfolio.

## Solution

- Nuxt 4 and TypeScript front end.
- n8n orchestration using its agent node with tool calling.
- PostgreSQL with pgvector for embeddings and retrieval.
- reCAPTCHA-protected API.
- Thumbs-up and thumbs-down feedback capture.
- Answers grounded in the curated markdown knowledge base in this repository.

## Technologies

- Nuxt 4
- TypeScript
- n8n
- pgvector
- RAG
- AI Agents

## Outcome

Visitors get grounded, specific answers about Mihail's work on demand, and the feedback capture shows which answers are landing.

## Links and Status

- Live: the chat widget on `https://mihaylov.io`
- Status: live on the portfolio site
