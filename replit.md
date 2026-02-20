# Ramadan Quiz Competition

## Overview
A live bilingual (Arabic/English) Ramadan quiz competition web app where 6 teams compete, answering 36 questions with a timed selection grid, real-time scoring, and admin panel.

## Tech Stack
- **Frontend**: React + Vite + TypeScript, shadcn/ui, Tailwind CSS, Framer Motion
- **Backend**: Express.js with REST API
- **Database**: PostgreSQL with Drizzle ORM
- **i18n**: react-i18next with Arabic (RTL) and English (LTR) support

## Project Structure
```
client/src/
  App.tsx              - Main app with routing
  lib/i18n.ts          - i18next translations (AR/EN)
  lib/useLanguage.tsx  - Language context + RTL support
  components/
    mosque-header.tsx  - Islamic themed header with language toggle
    question-grid.tsx  - 6x5 grid of question buttons
    timer.tsx          - 30-second countdown timer
    scoreboard.tsx     - Live team leaderboard
    question-display.tsx - Question with 4 options
  pages/
    welcome.tsx        - Landing page with rules
    game.tsx           - Main game view
    admin.tsx          - Admin control panel
    results.tsx        - Final results/leaderboard

server/
  db.ts               - PostgreSQL connection
  storage.ts          - DatabaseStorage class (all CRUD)
  routes.ts           - REST API endpoints
  seed.ts             - 6 teams + 36 questions seed data

shared/
  schema.ts           - Drizzle schema (teams, questions, gameSessions, teamScores, questionHistory)
```

## Key API Routes
- `GET /api/teams` - All 6 teams
- `GET /api/questions` - All 36 questions
- `GET /api/game/current` - Active game session with scores
- `POST /api/admin/login` - Admin auth (uses SESSION_SECRET)
- `POST /api/game/start|pause|resume|end|reset` - Game controls
- `POST /api/game/select-question` - Select a question
- `POST /api/game/answer` - Submit an answer
- `POST /api/game/skip` - Skip to next team
- `POST /api/game/adjust-score` - Manual score adjustment

## Game Flow
1. Admin starts game from /admin (password = SESSION_SECRET env var)
2. Teams take turns selecting questions from the 6x5 grid
3. 30-second timer counts down, answers validated server-side
4. Score updates: +10 for correct, 0 for incorrect/timeout
5. Auto-rotation to next team after each question
6. Game ends when all questions answered or admin ends it

## Database
- PostgreSQL via DATABASE_URL
- Schema pushed via `npx drizzle-kit push`
- Seeded automatically on startup (6 teams, 36 bilingual questions)

## Theme
- Ramadan Islamic: Deep blue (#1E40AF), Gold (#F59E0B), Cream backgrounds
- Arabic fonts: Cairo, Tajawal, Amiri
- Islamic geometric patterns, mosque silhouette SVG, crescent moon icons
