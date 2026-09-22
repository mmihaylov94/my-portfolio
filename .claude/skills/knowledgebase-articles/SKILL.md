---
name: knowledgebase-articles
description: How to write and edit the Markdown articles in knowledgebase/, which are the only source the site's AI assistant can answer from. Use this whenever creating a new knowledge base article, editing an existing one, changing its frontmatter, or deciding whether something belongs in a new article or an existing one. Also use it when the assistant has failed to answer a question and the fix is new content. Reach for it even if the request just says "add a page about X" or "update the FAQ" without mentioning the knowledge base or the assistant.
---

# Writing knowledge base articles

Everything in `knowledgebase/**/*.md` is read by an ingestion pipeline, split into
pieces, turned into embeddings and stored in a vector database. When a visitor asks the site's
assistant a question, it searches those pieces and answers from what it finds.

**This folder is the only thing the assistant can see.** Not the case study pages, not the Vue
composables, not the README. If the assistant cannot answer something, the fix is always to write
or extend an article here — never to point it at more of the repository.

## The one thing to understand

**Each `## ` section becomes one searchable chunk, on its own.**

The whole article is not what gets matched against a visitor's question. Each section is embedded
separately, retrieved separately, and handed to the model separately. So a section has to make
sense alone, with no surrounding context, because alone is how it will arrive.

That single fact explains every convention below.

## Headings are questions

Write `## ` headings as the question a visitor would actually type:

```markdown
## What is Mihail's job title?

Solutions Architect. This is the only correct public role label.

## How much experience does Mihail have?

His professional career began in May 2020...
```

Not `## Role` and `## Experience`. The heading is part of the embedded text, and a visitor's
question is far closer to *"What is Mihail's job title?"* than to the word *"Role"*. This is the
single highest-leverage thing about how these articles are written — it is why retrieval works
well on a corpus of only eleven documents.

The answer goes directly under its question, and it answers *that* question completely. If the
answer needs something established in an earlier section, either repeat it briefly or merge the
two sections. A chunk that says "as mentioned above" is a chunk that will be retrieved without
the above.

## Frontmatter

Every article opens with a YAML block between two `---` lines:

```markdown
---
doc_id: about-mihail
title: About Mihail Mihaylov
page_type: about
url: https://mihaylov.io/
source_type: knowledgebase
tags: [profile, biography, experience]
last_verified: 2026-08-13
---
```

| Key | Required | Notes |
|---|---|---|
| `doc_id` | **yes** | Stable identity. See below — this one matters more than it looks. |
| `title` | **yes** | Human-readable name for the article. |
| `url` | no, but do it | The page on the live site this article describes. |
| `page_type` | no | `about`, `contact`, `faq`, `project`, `services`… |
| `source_type` | no | Defaults to `knowledgebase`. Leave it. |
| `tags` | no | A YAML list. |
| `last_verified` | no, but do it | The date the content was last checked against reality. |

**`doc_id` is permanent.** It is the identity the pipeline upserts and purges against. Changing it
does not rename an article — it deletes the old one and creates a new one. Never change a `doc_id`
to match a new title, and never reuse one that another article already has: two articles sharing a
`doc_id` means one silently replaces the other in the index, and the losing article stops existing
as far as the assistant is concerned.

**`url` must be a real page.** Never a path containing `/knowledgebase/` or `/projects/` — those
exist in git, not on the site, and a visitor who follows one gets a 404. The assistant is
explicitly forbidden from emitting such links, and frontmatter is one of the few ways a bad one
could reach it.

**`last_verified` should be honest.** It is the date somebody actually confirmed the content is
still true, not the date the file was touched. Bump it when you verify; leave it when you fix a
typo.

## Writing the content

- **Answer, then elaborate.** The first sentence of a section should answer its heading. Detail
  follows.
- **Be specific and factual.** Dates, role names, technologies, numbers. The assistant is only as
  accurate as this text, and it will repeat what it finds.
- **Say what is no longer true.** `about-mihail.md` explicitly lists retired job titles and says
  they should not be used. That kind of negative statement is valuable — it stops the assistant
  repeating something stale it found elsewhere.
- **Keep sections self-contained but not bloated.** A few hundred words is comfortable. Sections
  over roughly 6000 tokens get split automatically, which breaks the one-section-one-answer
  property, so split them yourself at a sensible point instead.
- **No `# ` H1.** The title lives in frontmatter.
- **`### ` stays inside a section.** It subdivides an answer and travels with it; it does not
  create a new chunk.

## New article or extend an existing one?

Extend when the question belongs to a subject an article already covers — a new question about
hiring goes in `hiring.md` as a new `## ` section.

Create a new article when the subject is genuinely new: a new project, a new service. Projects
live in `knowledgebase/projects/` and use a `project-` prefixed `doc_id`
(`projects/glotsmith.md` → `doc_id: project-glotsmith`).

Prefer extending. Eleven focused articles retrieve better than forty thin ones, because near
duplicate chunks compete for the same slots.

## Check your work

The checker runs the *exact* parser the ingestion pipeline uses, so passing it means the article
will be indexed:

```bash
docker run --rm -v "$PWD/knowledgebase:/kb" \
    ghcr.io/mmihaylov94/portfolio-ai portfolio-ai-validate /kb
```

It also runs automatically on every push that touches `knowledgebase/**`
(`.github/workflows/knowledgebase.yml`). Errors fail the build; warnings do not.

What it cannot check is whether the content is *true*, whether the headings are the questions
people actually ask, or whether an answer stands on its own. Those are the things in this
document, and they are the ones that decide whether the assistant is any good.
