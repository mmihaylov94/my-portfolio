---
doc_id: project-portfolio-ai-assistant
title: mihaylov.io AI Assistant
page_type: project
url: https://mihaylov.io/
source_type: knowledgebase
tags: [rag, retrieval-augmented-generation, pgvector, python, fastapi, openai, ai-agent, tool-calling, evals, streaming, nuxt, typescript, vector-search]
last_verified: 2026-10-13
---

## Summary

The AI assistant on `mihaylov.io` is a retrieval-augmented chat assistant that answers questions about Mihail's work from a curated Markdown knowledge base. It is the round chat button in the bottom-right corner of the site, and it introduces itself as Rachel. Mihail built it in Python, and its source is public at `https://github.com/mmihaylov94/portfolio-ai`.

## How does the mihaylov.io AI assistant work?

The assistant is a retrieval-augmented generation system: it answers from a curated knowledge base rather than from a language model's training data.

Every message is first classified as a question about Mihail or his work, as small talk, or as off-topic. An off-topic message gets a fixed reply, and small talk gets a short reply with no search.

For a question about his work, the model has to search the knowledge base before it answers. It writes its own search queries and may search again, up to three rounds in all. Each query is embedded as a vector and matched against the knowledge base, which is stored in PostgreSQL with the pgvector extension, and the most relevant passages are handed to the model to answer from.

The answer is streamed to the browser as it is written, and the knowledge base articles its searches found most relevant are listed under it.

## What technology does the mihaylov.io AI assistant use?

- **Backend**: Python 3.12 and FastAPI, asynchronous throughout, using the OpenAI SDK directly with no RAG framework such as LangChain. Database access is psycopg 3 with hand-written SQL, and schema changes are Alembic migrations.
- **Data**: PostgreSQL with the pgvector extension, with an HNSW index on the embeddings.
- **Models**: OpenAI's language models classify each message and write the answers, and an OpenAI embedding model powers the search. The exact models are not fixed: the evaluation harness compares them, and the assistant moves to a better or cheaper one when it finds it.
- **Front end**: Nuxt 4 and TypeScript. The chat talks to the site's own Express API, which passes each question on to the assistant.
- **Tooling**: pytest, mypy, and ruff, with GitHub Actions building a Docker image.

## Which AI model does the mihaylov.io AI assistant use?

The mihaylov.io AI assistant runs on OpenAI's models. Language models classify each message and write the answer, and an embedding model turns the knowledge base and each search into vectors.

The exact models are deliberately not named here, because they are not fixed. An evaluation harness scores the assistant on the same questions with different models, and the assistant moves to a better or cheaper one when the scores support it. The models in use today are in the project's public repository, `https://github.com/mmihaylov94/portfolio-ai`.

## Why did Mihail build the mihaylov.io AI assistant?

Two reasons. A portfolio site is a static document that answers only the questions its author anticipated, and a conversational interface lets a visitor ask what they actually want to know. It is also a working demonstration of retrieval-augmented generation, vector search, and agentic tool calling on Mihail's own infrastructure, rather than a claim on a CV.

## How was the mihaylov.io AI assistant built?

Mihail built it twice. The first version of the mihaylov.io AI assistant ran on a self-hosted n8n instance, using n8n's AI agent node with tool calling. In 2026 he rebuilt it as a Python service, to add what the n8n version did not have: answers streamed as they are written, an evaluation harness for comparing models and prompts, thumbs up and down on answers, and a record of what each answer costs. The prompts carried over from the n8n version almost unchanged.

He built the Python version with Claude Code as a pair programmer, reviewing every change himself. Its repository, `https://github.com/mmihaylov94/portfolio-ai`, includes a lesson series on the Python behind it, written as the project was built.

## Does the assistant make things up?

The assistant answers from a curated knowledge base rather than from general model knowledge, which substantially reduces invention. It is a retrieval system, not a general chatbot. If something is not in the knowledge base, it is instructed to say so rather than guess.

Its links are checked in code as well as in its instructions: before an answer reaches the visitor, a filter takes out links to pages that exist only in the knowledge base's repository and not on the site, or replaces them with a real page.

It can still be wrong. Answers can be rated with a thumbs up or a thumbs down, so that mistakes get noticed.

## How is the assistant's quality measured?

An evaluation harness scores the mihaylov.io AI assistant against a golden dataset of questions written from the knowledge base. For each question it checks whether the right articles were retrieved and whether the answer follows the rules, such as containing no made-up links. A separate judge model grades each answer for completeness against a reference answer, and for faithfulness to the passages the assistant was given. Every run is stored with the exact configuration that produced it, so two set-ups can be compared.

The harness decides how the assistant runs in production, including which model writes the answers. In its first runs, lowering the model's reasoning effort to the minimum brought the median wait for the first word of an answer from 15.6 seconds down to 3.9, and the cost of an answer down by 45%, with no measurable loss in completeness or style and a small one in faithfulness. A later change of model, with a revised prompt, was adopted the same way: the answers scored higher for faithfulness and for style, and slightly lower for completeness, at about a third of the cost.

The same harness found a fault in the classifier, the step that decides whether a message is about Mihail's work. Sent each question five times at production's settings, it chose the wrong route 28 times in 270, such as refusing "What is Glotsmith?" as off-topic. A change to its prompt brought that to none.

## What happens to what I type into the chat?

Conversations with the mihaylov.io AI assistant are stored for 90 days, so that Mihail can see what visitors ask and where the assistant fails them, and are then deleted. A backup taken before a database change can hold them for up to 30 days longer. A thumbs up or down, and any comment left with it, is stored with the answer it rates.

Each message is sent to OpenAI's API to be answered, with the storing of responses on OpenAI's side switched off.

A visitor's IP address is never stored as it is, only as a keyed hash, together with the browser's user agent and the page of the site the conversation started on. The chat sets no cookies. So that a reload does not lose the conversation, it is also kept in the visitor's own browser, where it can be resumed for 24 hours after its last message and is cleared by "New conversation". Nothing a visitor types is written to the server's logs.

The chat asks visitors not to share personal details.

## How does the assistant stay up to date?

The knowledge base behind the mihaylov.io AI assistant is a set of Markdown articles in the site's public GitHub repository, `mmihaylov94/my-portfolio`. An ingestion job reads them every hour. It splits each article at its headings, so that each question and its answer are stored and searched as one passage, and it embeds only the articles that have changed, so a run that finds nothing new costs nothing.

Articles removed from the repository are removed from the index, with a guard that stops a faulty run from deleting most of it. A change to an article reaches the assistant within the hour.

## What infrastructure does the assistant run on?

The mihaylov.io AI assistant runs in Docker on the same AWS EC2 instance as the site, which sits behind Cloudflare and Traefik. The assistant's own API has no public address: it is reachable only inside the server's Docker network, and the site's API, which holds the key, passes visitors' questions to it.

A second container runs the scheduled jobs: the hourly ingestion and the nightly deletion of conversations older than 90 days. The data is in the assistant's own database on the server's PostgreSQL, with pgvector enabled. Rate limits and a daily spending cap bound what it can cost.

GitHub Actions builds the image, and only when the linter, the type checker, and the tests pass.

## Is the assistant's source code public?

Yes. The source of the mihaylov.io AI assistant is public under the MIT licence at `https://github.com/mmihaylov94/portfolio-ai`, including its prompts, its evaluation dataset and results, and the design notes that record why each decision was made.

The source of the site itself, including this knowledge base, is public too, at `https://github.com/mmihaylov94/my-portfolio`, also under the MIT licence.
