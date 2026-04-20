---
title: Langy Portfolio Backend
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# Developer Portfolio | Clorece

Welcome to my professional portfolio. I am a developer passionate about building interactive, AI-driven experiences that bridge the gap between complex technology and intuitive user interfaces.

## About Me

I focus on developing applications that solve real-world problems through a combination of engineering and artificial intelligence. My work ranges from full-stack web platforms to intelligent automation tools.

- **Currently:** Building AI-driven educational tools and modern web experiences.
- **Interests:** Natural Language Processing (NLP), Semantic Search, and Interactive Game Design.
- **Philosophy:** Technology should be transparent, secure, and user-centric.

## Skills & Interests

- **Languages:** Python, TypeScript, JavaScript, SQL
- **AI/ML:** Sentence Transformers, NLP, Semantic Analysis, WordNet
- **Frontend:** React, Framer Motion, Tailwind CSS
- **Backend:** FastAPI, Discord.py, Node.js
- **Cloud/DevOps:** Supabase (PostgreSQL), Docker, GitHub Actions, Hugging Face

---

## Featured Project: Langy

**Langy** is a sophisticated language learning bot designed to make translation practice more intuitive and rewarding. It goes beyond simple string matching by understanding the *meaning* behind your answers.

### The Hybrid Accuracy Engine
Most language bots fail if you have a single typo or use a synonym. Langy solves this with a modular, 3-tier scoring system:

1.  **Expert Dictionary Layer (NEW):** Before scoring, Langy consults authoritative dictionaries (Jisho, CEDICT, Wiktionary) to verify word existence and award "Confidence Bonuses."
2.  **Semantic Analysis (60%):** Uses vector embeddings (`all-MiniLM-L6-v2`) to compare the "intent" of your translation.
3.  **Linguistic Hierarchy (40%):** Leverages **WordNet** and specialized language tools to identify synonyms and categorical relationships.

### Expert Language Support
Langy currently supports **21 top-studied languages**, each with dedicated expert tool verification:

| Category | Languages | Expert Sources |
| :--- | :--- | :--- |
| **Asian** | Japanese, Chinese, Korean, Hindi, Vietnamese, Indonesian, Filipino | Jisho, CEDICT, Free Dict, Wiki |
| **European** | Spanish, French, German, Italian, Portuguese, Dutch, Polish, Swedish, Greek, Czech, Russian | RAE, Larousse, Wiki |
| **Middle Eastern** | Arabic, Turkish, Hebrew | Wiki / Almaany |

### Dual-Platform Synergy
- **Discord Bot:** Learn where you hang out. Get daily challenges, track streaks, and compete on a global leaderboard directly in Discord.
- **Web Interface:** A modern app that syncs with Discord for a seamless learning experience across devices.

---

## Getting Started

### Local Setup (Backend)
1.  **Environment:** Copy `.env.example` to `.env` and fill in your Discord credentials and Supabase URL.
2.  **Install:** `pip install -r requirements.txt`
3.  **Run:** `python api.py` (Starts both the FastAPI server and the Discord Bot).

### Local Setup (Frontend)
1.  **Navigate:** `cd portfolio-web`
2.  **Install:** `npm install`
3.  **Run:** `npm run dev`

---

## Contact

Feel free to reach out for collaborations or to check out more of my work!

- **GitHub:** [your-github-profile]
- **Discord:** [your-discord-handle]
- **Portfolio:** [your-deployed-url]
