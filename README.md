---
title: Langy Portfolio Backend
emoji: 🌍
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# Langy Portfolio Backend

This is the 16GB RAM backend for the Langy Language Learning Bot and Portfolio. 
It runs a unified FastAPI server and Discord Bot using Docker.

## Tech Stack
- **Backend:** FastAPI (Python)
- **Bot:** Discord.py
- **ML Model:** Sentence-Transformers (all-MiniLM-L6-v2)
- **Database:** PostgreSQL (Supabase)
- **Hosting:** Hugging Face Spaces (Docker)

## How it works
This space is automatically synced from GitHub. Every time code is pushed to the main repository, GitHub Actions pushes the latest version here, triggering a new Docker build.
