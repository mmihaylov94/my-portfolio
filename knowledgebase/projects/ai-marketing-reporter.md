---
doc_id: project-ai-marketing-reporter
title: AI Marketing Reporter
page_type: project
url: https://mihaylov.io/?section=projects
source_type: knowledgebase
tags: [n8n, automation, reporting, marketing, analytics, llm]
last_verified: 2026-08-13
---

## Summary

AI Marketing Reporter is an automated weekly reporting pipeline built in n8n. It pulls Meta Ads, Google Ads, and Google Analytics data and generates LLM-written performance reports.

## Problem Solved

Manual weekly reporting across advertising and analytics platforms is time-consuming and inconsistent.

## Solution

- Aggregates data from Meta Ads, Google Ads, and Google Analytics on a weekly schedule.
- Generates LLM-written performance reports from the collected data.
- Produces client-ready output rather than raw exports.

## Technologies

- n8n
- LLM
- Google Analytics
- Meta Ads

## Outcome

Automates recurring reporting and produces client-ready performance summaries without manual data gathering.

## Links and Status

- Live URL: `https://www.youtube.com/@mihaylov-dev`
- GitHub URL: not provided in project data
- Status: publicly linked via demo video

## How does the AI Marketing Reporter work?

The AI Marketing Reporter runs on a weekly schedule in n8n. It authenticates against Meta Ads, Google Ads, and Google Analytics, pulls the reporting period's data from each, normalises it into a common shape, and passes it to a language model that writes a performance summary in prose rather than producing a table of numbers.

## Why is the AI Marketing Reporter useful?

Weekly reporting across three advertising and analytics platforms is repetitive, easy to postpone, and inconsistent between people. The value is not that the data is collected, since each platform can export its own. It is that the three sources are reconciled into one narrative that says what changed and what it means, on a schedule, without anyone remembering to do it.

## What does the AI Marketing Reporter demonstrate?

It is a working example of an LLM used for what language models are actually good at: turning structured data into readable explanation. The interesting engineering is around the model rather than in it, covering authentication against three separate APIs, differing rate limits and data shapes, and handling a platform returning incomplete data for the period without the report silently understating results.