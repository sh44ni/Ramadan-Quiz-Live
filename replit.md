# Ramadan Quiz Competition

## Overview
A live bilingual (Arabic/English) Ramadan quiz competition web app where 6 teams compete. Features 31+ questions, with each team's **leader** (captain) selecting and answering 6 questions from a shared pool. Game progresses through phases: Entry (60s for team leaders to join) → Selection (60s, leader picks from all 31 unlocked numbers) → Preparation (30s to read question) → Answer (30s to submit). Questions lock globally once answered. Teams rotate after 6 questions each. Admin can trigger a tiebreaker round with specific tied teams. All coordination happens via real-time WebSocket communication. Designed for a **two-device setup**: team leader device for selecting/answering questions and a large audience display screen for spectators. Features admin controls, email-based OTP access, full internationalization with RTL support, and a Ramadan-themed design.

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
- **Phase-based controls**: Admin monitors and can intervene in the player-driven flow
- All game controls operate via WebSocket for instant effect:
  - **Start Game**: Begins entry phase (60s countdown for teams to join)
  - **Skip Entry**: Immediately ends entry phase and starts selection
  - **Pause/Resume**: Freezes/continues current phase timer
  - **Force Advance**: Manually advance to next phase/turn
  - **End Game**: Finishes the game, triggers results display
  - **Reset**: Ends current session and clears all state
  - **Set Current Team**: Manually select which team goes next
  - **Adjust Score**: Add or remove points for any team (+/- 1)
- Shows current phase, active player, and timer status
- Has a "Display Screen" button to open `/display` in a new tab

## WebSocket Architecture

### Game Phases
1. **Entry** (60s): Teams join the game via their devices
2. **Selection** (60s): Active player picks from their 6 assigned question numbers
3. **Preparation** (30s): Question displayed for reading
4. **Answer** (30s): Player submits their answer
- Auto-transitions between phases with timeout handlers
- Auto-pick on selection timeout (lowest available number)
- Sequential player rotation within teams, then team rotation

### Server (`server/websocket.ts`)
- WebSocket server at path `/ws`
- **In-memory game state**: Phase, turn indices, player assignments, question number mappings stored in memory (no DB schema changes)
- **Per-player question assignments**: Each player gets 6 randomly assigned numbers from 1-31 (may overlap between players)
- **Server-side timers**: Countdown runs on server with auto-transition to next phase
- **Full state broadcast**: `broadcastFullState()` called after every state change for consistency
- **Race condition prevention**: Duplicate answer guards and used question tracking

### Client Hook (`client/src/lib/useGameSocket.ts`)
- `useGameSocket()` hook manages all real-time state
- GameState includes: phase, currentTeamId, currentPlayerName, currentPlayerAvailableNumbers, usedQuestionNumbers, teamPlayers, playerAssignments, entryTeams, totalQuestions, currentTeamIndex, currentPlayerIndex, teamOrder
- Auto-connects with reconnection on disconnect (2-second retry)
- Returns: `gameState`, `timer`, `answerResult`, `connected`, plus action functions

### WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `request-state` | Client → Server | Request current full game state |
| `game-state` | Server → Client | Full game state (session, scores, teams, questions, phase, turn info, assignments) |
| `timer-update` | Server → Client | Timer tick with seconds, running status, and phase |
| `player-select-question` | Client → Server | Player selects a question number from their assigned numbers |
| `question-selected` | Server → All | Question was selected, includes question data and number |
| `submit-answer` | Client → Server | Team submits answer |
| `answer-result` | Server → All | Answer result with correct/incorrect and correct answer |
| `turn-changed` | Server → All | Next team/player's turn |
| `phase-changed` | Server → All | Game phase transition |
| `team-joined` | Server → All | Team joined during entry phase |
| `team-completed` | Server → All | Team finished, next team starting |
| `time-up` | Server → All | Timer expired, auto-action triggered |
| `admin-start` | Client → Server | Start new game (entry phase) |
| `admin-skip-entry` | Client → Server | Skip entry phase, start selection |
| `admin-force-advance` | Client → Server | Force advance to next phase/turn |
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
10. **Auto team progression**: After a team completes 5 questions, system automatically switches to the next team with a "Team X completed, moving to Team Y" notification
11. Admin clicks "Next Question" to continue with the next team
12. Game ends when all 30 questions answered (5 per team × 6 teams) or admin ends manually
13. Final results shown on `/results` page with rankings

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
