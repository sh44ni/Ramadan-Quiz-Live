# Ramadan Quiz Competition

## Overview
A live bilingual (Arabic/English) Ramadan quiz competition web app where 6 teams compete, answering 36 questions with real-time scoring powered by WebSocket. Designed for a **two-device setup**: team devices for selecting/answering questions and a large audience display screen for spectators. Features admin controls, email-based OTP access, full internationalization with RTL support, and a Ramadan-themed design.

## Tech Stack
- **Frontend**: React + Vite + TypeScript, shadcn/ui, Tailwind CSS, Framer Motion
- **Backend**: Express.js with REST API + WebSocket (ws library)
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket server at `/ws` path for live game synchronization
- **i18n**: react-i18next with Arabic (RTL) and English (LTR) support
- **Email**: Resend API for OTP-based player authentication

## Project Structure
```
client/src/
  App.tsx                  - Main app with routing (header hidden on /display)
  lib/
    i18n.ts                - i18next translations (AR/EN), all UI strings
    useLanguage.tsx         - Language context + RTL support
    useGameSocket.ts        - WebSocket client hook for real-time state
    queryClient.ts          - TanStack Query setup
  components/
    mosque-header.tsx       - Islamic themed header with language toggle
    question-grid.tsx       - 6x6 grid of question buttons
    timer.tsx               - 30-second countdown timer component
    scoreboard.tsx          - Live team leaderboard component
    question-display.tsx    - Question with 4 answer options
  pages/
    welcome.tsx             - Landing page with rules and navigation
    login.tsx               - Email OTP login for players
    game.tsx                - Team device view (current question, answer)
    display.tsx             - Audience display screen (fullscreen, no header)
    admin.tsx               - Admin control panel with WebSocket controls
    results.tsx             - Final results/leaderboard
    rules.tsx               - Game rules page
    not-found.tsx           - 404 page

server/
  index.ts                 - Express server entry point
  db.ts                    - PostgreSQL connection
  storage.ts               - DatabaseStorage class (all CRUD operations)
  routes.ts                - REST API endpoints
  websocket.ts             - WebSocket server (game events, timer, state broadcast)
  seed.ts                  - 6 teams + 36 questions seed data
  vite.ts                  - Vite dev server middleware (DO NOT MODIFY)

shared/
  schema.ts                - Drizzle schema (teams, questions, gameSessions, teamScores, questionHistory)
```

## Two-Device Setup Guide

The app is designed for a live event with two types of screens:

### Team Devices (`/game`)
- Used by each team captain on a phone/tablet
- Players must authenticate via email OTP at `/login`
- On their turn: shows the current question with 4 answer options (admin selects questions)
- Timer bar shows countdown (synced via WebSocket from server)
- When it's not their turn: shows "waiting for your turn" message
- Simplified UI: no question grid, just current question or waiting state
- Automatically receives score updates and turn changes in real-time

### Audience Display Screen (`/display`)
- Designed for a large TV/projector visible to all spectators
- **Fullscreen mode** - no header, no navigation bar
- Open `/display` in a browser on the projector/TV computer
- Shows in real-time:
  - Current team name and color indicator
  - Question text (when selected by admin)
  - Circular countdown timer with color changes (green > yellow > red)
  - Answer options with correct/incorrect highlighting after submission
  - Live leaderboard sidebar with score bars and rank icons
  - Progress counter (questions answered / total)
  - Waiting animation when no question is active
  - Mini question grid showing which questions are answered
  - "Game Over" screen with final rankings when finished
- Connection status badge shows live/offline status
- Supports Arabic (RTL) and English display based on language setting

### Admin Panel (`/admin`)
- Password-protected (uses SESSION_SECRET environment variable)
- **Admin-controlled workflow**: Admin drives all question selection and timing
- All game controls operate via WebSocket for instant effect:
  - **Start New Game**: Creates a new session, initializes scores for all 6 teams
  - **Next Question**: Selects the next sequential question for the current team
  - **Start Timer**: Manually starts the 30-second countdown
  - **Show Answer**: Reveals correct answer (when timer hasn't started or for manual reveal)
  - **Reset Timer**: Resets timer back to 30 seconds
  - **Pause/Resume**: Freezes/continues the timer and game state
  - **Skip**: Moves to the next team without answering
  - **End Game**: Finishes the game, triggers results display
  - **Reset**: Ends current session and clears state
  - **Set Current Team**: Manually select which team goes next
  - **Adjust Score**: Add or remove points for any team (+/- 1)
- Question Control section shows current question preview with category badge
- Has a "Display Screen" button to open `/display` in a new tab
- Shows live game status, current team, and all team scores

## WebSocket Architecture

### Server (`server/websocket.ts`)
- WebSocket server at path `/ws`
- **Server-side timer**: Countdown runs on the server and broadcasts to all clients, ensuring perfect synchronization with no client drift
- **Auto time-up handling**: When timer hits 0, server automatically submits an empty answer and shows the correct answer (admin controls progression to next question/team)
- **Race condition prevention**: Duplicate answer guards prevent double-submission if timer and user answer race

### Client Hook (`client/src/lib/useGameSocket.ts`)
- `useGameSocket()` hook manages all real-time state
- Auto-connects with reconnection on disconnect (2-second retry)
- Returns: `gameState`, `timer`, `answerResult`, `connected`, plus action functions

### WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `request-state` | Client → Server | Request current full game state |
| `game-state` | Server → Client | Full game state update (session, scores, teams, questions, current question) |
| `timer-update` | Server → Client | Timer tick with seconds and running status |
| `select-question` | Client → Server | Team selects a question from grid |
| `question-selected` | Server → All | Question was selected (timer NOT auto-started) |
| `admin-next-question` | Client → Server | Admin selects next sequential question |
| `admin-start-timer` | Client → Server | Admin manually starts 30s countdown |
| `admin-show-answer` | Client → Server | Admin reveals correct answer |
| `admin-reset-timer` | Client → Server | Admin resets timer to 30s |
| `submit-answer` | Client → Server | Team submits answer |
| `answer-result` | Server → All | Answer result with correct/incorrect and correct answer |
| `turn-changed` | Server → All | Next team's turn |
| `time-up` | Server → All | Timer expired, auto-skip triggered |
| `admin-start` | Client → Server | Start new game |
| `admin-pause` | Client → Server | Pause game |
| `admin-resume` | Client → Server | Resume game |
| `admin-end` | Client → Server | End game |
| `admin-reset` | Client → Server | Reset game |
| `admin-skip` | Client → Server | Skip to next team |
| `admin-set-team` | Client → Server | Set specific team as current |
| `admin-adjust-score` | Client → Server | Adjust team score |
| `game-started` | Server → All | Game started notification |
| `game-paused` | Server → All | Game paused notification |
| `game-resumed` | Server → All | Game resumed notification |
| `game-finished` | Server → All | Game ended notification |
| `game-reset` | Server → All | Game reset notification |

## Key API Routes
- `GET /api/teams` - All 6 teams
- `GET /api/questions` - All 36 questions
- `GET /api/game/current` - Active game session with scores
- `POST /api/admin/login` - Admin auth (body: `{password}`, checks SESSION_SECRET)
- `POST /api/game/start|pause|resume|end|reset` - Game controls (REST fallback)
- `POST /api/game/select-question` - Select a question
- `POST /api/game/answer` - Submit an answer
- `POST /api/game/skip` - Skip to next team
- `POST /api/game/adjust-score` - Manual score adjustment
- `POST /api/auth/request-otp` - Send OTP to player email
- `POST /api/auth/verify-otp` - Verify OTP and get player token
- `GET /api/auth/verify-token` - Check if player token is valid

## Game Flow
1. Admin opens `/admin` and logs in with password (SESSION_SECRET env var)
2. Admin clicks "Start New Game" - creates session, initializes all team scores
3. Display screen (`/display`) on projector shows the game live
4. Team captains on their devices (`/game`) see the current question when it's their turn
5. Admin clicks "Next Question" to select the next sequential question for the current team
6. Question appears on all screens simultaneously via WebSocket
7. Admin clicks "Start Timer" to begin the 30-second countdown
8. Team submits answer OR timer expires (server auto-handles time-up)
9. Result shown: correct (+1 point) or incorrect (0 points), correct answer revealed with 4-second feedback animation
10. Admin clicks "Next Question" to continue, auto-rotates to next team after each team's set of questions
11. Game ends when all 36 questions answered or admin ends manually
12. Final results shown on `/results` page with rankings

## Player Authentication (OTP)
- Players access `/login` to authenticate
- Enter authorized email address
- Receive 6-digit OTP via Resend email service
- Verify OTP to get access token (stored in localStorage)
- Token verified on `/game` page load
- Unauthenticated users see "Authentication Required" prompt

## Database
- PostgreSQL via DATABASE_URL
- Schema pushed via `npx drizzle-kit push`
- Seeded automatically on startup (6 teams, 36 bilingual questions)
- Seed function checks for existing data to prevent duplication
- Team names synced on every startup to keep production updated

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-provided)
- `SESSION_SECRET` - Admin panel password
- `RESEND_API_KEY` - Resend API key for sending OTP emails

## Teams (6 total)
| # | Arabic Name | English Name | Color | Captain |
|---|------------|--------------|-------|---------|
| 1 | الفريق (1): البداية | Team 1: Al-Bidaya (The Beginning) | Blue #3B82F6 | مهاجر محمد |
| 2 | الفريق (2): الفلاح | Team 2: Al-Fallah (The Farmer) | Green #10B981 | عمر سعيد |
| 3 | الفريق (3): أهل الراية | Team 3: Ahl Al-Raya (Flag People) | Amber #F59E0B | حاتم سعيد |
| 4 | الفريق (4): النخبة | Team 4: Al-Nukhba (The Elite) | Red #EF4444 | أحمد علي حمدان |
| 5 | الفريق (5): فلج غربة | Team 5: Falaj Gharba | Purple #8B5CF6 | فهد محمد |
| 6 | الفريق (6): مرسى الفكر | Team 6: Marsa Al-Fikr (Harbor of Thought) | Orange #F97316 | حميد خالد |

## Theme
- Ramadan Islamic: Deep blue (#1E40AF), Gold (#F59E0B), Cream backgrounds
- Arabic fonts: Cairo, Tajawal, Amiri
- Islamic geometric patterns, mosque silhouette SVG, crescent moon icons
- Framer Motion animations throughout (floating elements, transitions, score updates)

## Design Rules
- No custom hover styles on buttons
- Full-width Card borders
- No toggle-elevate classes
- Display page: fullscreen, no header/navigation

## i18n
- All UI strings stored in `client/src/lib/i18n.ts`
- Two language resources: `en` and `ar`
- Language toggle in mosque header (not shown on display page)
- RTL layout automatically applied when Arabic is selected
- Arabic fonts applied via `font-arabic` CSS class
