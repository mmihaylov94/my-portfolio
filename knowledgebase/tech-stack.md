---
doc_id: tech-stack
title: Technical Skills and Tools
page_type: tech-stack
url: https://mihaylov.io/?section=about
source_type: knowledgebase
tags:
  [
    technical-skills,
    ai,
    automation,
    backend,
    frontend,
    data,
    cloud,
    devops,
    aws,
    ai-services,
    billing,
  ]
last_verified: 2026-09-25
---

## Summary

Mihail's technical profile combines solution architecture, automation and integration platforms, full-stack web engineering, and the cloud and delivery tooling used to run systems in production.

## What is Mihail's current technology stack?

### AI

LLM APIs, retrieval-augmented generation, vector search, pgvector, AI agents, tool calling, MCP, Claude Skills, Google Cloud AI, and Azure AI Document Intelligence.

### Automation

n8n, Microsoft Power Automate, Zapier, UiPath, Automation Anywhere, and Microsoft Power Platform.

### Backend

PHP (CodeIgniter, Laravel), Node.js, Express, TypeScript, REST APIs, and webhooks.

### Frontend

Vue 3, Nuxt, React, Vite, and Tailwind CSS.

### Data

PostgreSQL, pgvector, MySQL, and SQL Server.

### Cloud and DevOps

AWS (EC2, RDS, S3, IAM, SES, SNS, VPC), Docker, Docker Compose, GitHub Actions, Traefik, Cloudflare, and Linux.

### Testing

Vitest and Playwright.

## What AI experience does Mihail have specifically?

He has built retrieval-augmented generation over a curated knowledge base with embeddings and vector search in PostgreSQL using pgvector, AI agents that use tool calling to decide their own retrieval steps, a custom MCP server with supporting Claude Skills, and a custom SSO-authenticated proxy that filters personal data out of what an agent is allowed to see.

Three production examples exist: the MCP server, Claude Skills, and proxy built for business teams at Businessmap; the retrieval-augmented assistant running on this portfolio site; and the AI Marketing Reporter, an n8n pipeline in which a language model writes weekly marketing performance reports, running for a client on the client's own n8n instance.

## What has Mihail used in past delivery that is not in the current stack?

Python and C#, both from his enterprise RPA period at Deloitte.

Azure AI Document Intelligence, previously named Azure Forms Recogniser, also dates from that period, but it is part of his current stack: his n8n automation framework uses it for OCR, and Glotsmith supports it as an optional OCR provider.

## Does Mihail know Python?

Yes, from his enterprise RPA work at Deloitte, where he used it alongside UiPath, Automation Anywhere, C#, and SQL Server.

It is not part of his current stack, and none of the projects in his portfolio use it. Describe it as prior experience from the RPA period rather than a language he works in day to day, and do not attribute any portfolio project to it.

## Which cloud AI services does Glotsmith use?

In production, Glotsmith uses Google Cloud for all four:

- Translation: Google Cloud Translation
- Text-to-speech: Google Cloud Text-to-Speech
- Optical character recognition: Google Cloud Vision
- Speech-to-text: Google Cloud Speech-to-Text

The provider layer is pluggable, and alternatives are implemented but switched off: DeepL for translation, Azure AI Speech for text-to-speech, and Azure AI Document Intelligence or Tesseract.js, running on the server, for OCR.

Billing runs through Paddle as Merchant of Record, which handles VAT, GST, and US sales tax.

## What is Mihail strongest at technically?

- Solution architecture across discovery, requirements, design, and delivery.
- API and integration design, including webhook-driven and bi-directional integrations.
- Workflow and process automation on both low-code platforms and custom code.
- RPA programme delivery in enterprise environments.
- Production AI systems, including retrieval-augmented generation and agent tool calling.
- Operational reliability, maintainability, and production ownership.

## What professional certifications does Mihail hold?

Certified Advanced RPA Developer v1.0 (UiARD, UiPath), Certified RPA Associate (UiRPA, UiPath), and Certified Advanced RPA Professional A360 (Automation Anywhere).
