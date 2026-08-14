---
doc_id: project-portfolio-ai-assistant
title: mihaylov.io AI Assistant
page_type: project
url: https://mihaylov.io/
source_type: knowledgebase
tags: [rag, retrieval-augmented-generation, pgvector, n8n, ai-agent, tool-calling, nuxt, typescript, vector-search]
last_verified: 2026-08-13
---

## Summary

The AI assistant on `mihaylov.io` is a retrieval-augmented chat assistant that answers questions about Mihail's work from a curated markdown knowledge base. It is the chat widget in the bottom-right corner of the site, and it introduces itself as Rachel.

## How does the mihaylov.io AI assistant work?

The assistant is a retrieval-augmented generation system. Questions are embedded as vectors and matched against a curated markdown knowledge base stored in PostgreSQL using the pgvector extension. The most relevant passages are retrieved and passed to a language model, which answers from that content rather than from its training data.

Orchestration runs through a self-hosted n8n instance using its AI agent node with tool calling, so the model can decide which retrieval steps to take rather than following a fixed pipeline.

## What technology does the mihaylov.io AI assistant use?

- Nuxt 4 and TypeScript for the front end
- An Express API that forwards requests to n8n webhooks
- Self-hosted n8n for orchestration, using the AI agent node with tool calling
- PostgreSQL with the pgvector extension for embeddings and vector search
- Google reCAPTCHA to protect the endpoint from abuse
- Thumbs-up and thumbs-down feedback capture on every answer

## Why did Mihail build the mihaylov.io AI assistant?

Two reasons. A portfolio site is a static document that answers only the questions its author anticipated, and a conversational interface lets a visitor ask what they actually want to know. It is also a working demonstration of retrieval-augmented generation, vector search, and agentic tool calling on Mihail's own infrastructure, rather than a claim on a CV.

## Does the assistant make things up?

The assistant answers from a curated knowledge base rather than from general model knowledge, which substantially reduces invention. It is a retrieval system, not a general chatbot. If something is not in the knowledge base, the correct behaviour is to say so rather than guess.

## What infrastructure does the assistant run on?

It runs on Mihail's own Docker infrastructure behind Traefik, alongside a self-hosted n8n instance and a shared PostgreSQL database with pgvector enabled, with automated certificate issuance.