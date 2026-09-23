---
doc_id: project-ai-marketing-reporter
title: AI Marketing Reporter
page_type: project
url: https://mihaylov.io/?section=projects
source_type: knowledgebase
tags: [n8n, automation, reporting, marketing, analytics, llm]
last_verified: 2026-09-23
---

## Summary

AI Marketing Reporter is an automated weekly reporting pipeline built in n8n. It pulls Meta Ads, Google Ads, and Google Analytics data and generates LLM-written performance reports. It runs in production for a client, on the client's own n8n instance.

## Problem Solved

Manual weekly reporting across advertising and analytics platforms is time-consuming and inconsistent.

## Solution

- Aggregates data from Meta Ads, Google Ads, and Google Analytics on a weekly schedule, for every client in a client list.
- Reads each client's goals and optimisation rules from Google Sheets.
- Generates LLM-written performance analysis and recommendations from the collected data.
- Emails the weekly report and records the metrics and recommendations in Google Sheets.
- Produces client-ready output rather than raw exports.

## Technologies

- n8n
- OpenAI language models
- Google Ads
- Google Analytics
- Meta Ads
- Google Sheets

## Outcome

Automates recurring reporting and produces client-ready performance summaries without manual data gathering.

## Links and Status

- Live URL: none. The workflow runs on the client's own n8n instance, and there is no public demo yet.
- GitHub URL: none. The workflow is private.
- Status: in production for a client.

## How does the AI Marketing Reporter work?

The AI Marketing Reporter runs on a weekly schedule in n8n. It loads the client list, with each client's goals and optimisation rules, from Google Sheets. For each client it authenticates against Meta Ads, Google Ads, and Google Analytics, pulls the reporting period's data from each, and normalises it into a common shape. A language model then writes the performance analysis and recommendations as structured output, which is validated before use. The report is emailed, and the metrics and recommendations are appended to Google Sheets.

## Why is the AI Marketing Reporter useful?

Weekly reporting across three advertising and analytics platforms is repetitive, easy to postpone, and inconsistent between people. The value is not that the data is collected, since each platform can export its own. It is that the three sources are reconciled into one narrative that says what changed and what it means, on a schedule, without anyone remembering to do it.

## What does the AI Marketing Reporter demonstrate?

It is a working example of an LLM used for what language models are actually good at: turning structured data into readable explanation. The interesting engineering is around the model rather than in it: authentication against three separate APIs, differing rate limits and data shapes, and a platform returning no data for the period. When that happens, the failure is emailed to the operator, and the model is instructed never to infer or fabricate missing metrics.
