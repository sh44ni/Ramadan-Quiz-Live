import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "./storage";
import { log } from "./index";

type GamePhase = "idle" | "entry" | "selection" | "preparation" | "answer" | "paused" | "team-complete" | "finished";

interface InMemoryGameState {
  phase: GamePhase;
  sessionId: number | null;
  totalQuestions: number;
  questionsPerTeam: number;
  teamOrder: number[];
  teamPlayers: Record<number, string[]>;
  currentTeamIndex: number;
  teamQuestionsAnswered: Record<number, number>;
  usedQuestionNumbers: number[];
  selectedQuestionId: number | null;
  questionNumberMap: Record<number, number>;
  timerSeconds: number;
  timerRunning: boolean;
  entryTeams: number[];
  pausedPhase: GamePhase | null;
  pausedTimerSeconds: number;
  gameError: string | null;
}

const defaultGameState: InMemoryGameState = {
  phase: "idle",
  sessionId: null,
  totalQuestions: 31,
  questionsPerTeam: 5,
  teamOrder: [],
  teamPlayers: {},
  currentTeamIndex: 0,
  teamQuestionsAnswered: {},
  usedQuestionNumbers: [],
  selectedQuestionId: null,
  questionNumberMap: {},
  timerSeconds: 0,
  timerRunning: false,
  entryTeams: [],
  pausedPhase: null,
  pausedTimerSeconds: 0,
  gameError: null,
};

let gameState: InMemoryGameState = { ...defaultGameState };
let wss: WebSocketServer;
let timerInterval: ReturnType<typeof setInterval> | null = null;

function broadcast(data: any) {
  if (!wss) return;
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  gameState.timerRunning = false;
}

function startTimer(duration: number, onComplete: () => void) {
  stopTimer();
  gameState.timerSeconds = duration;
  gameState.timerRunning = true;
  broadcast({ type: "timer-update", seconds: gameState.timerSeconds, running: true, phase: gameState.phase });

  timerInterval = setInterval(() => {
    gameState.timerSeconds--;
    broadcast({ type: "timer-update", seconds: gameState.timerSeconds, running: true, phase: gameState.phase });

    if (gameState.timerSeconds <= 0) {
      stopTimer();
      broadcast({ type: "timer-update", seconds: 0, running: false, phase: gameState.phase });
      onComplete();
    }
  }, 1000);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getCurrentTeamId(): number | null {
  if (gameState.teamOrder.length === 0) return null;
  return gameState.teamOrder[gameState.currentTeamIndex % gameState.teamOrder.length];
}

function getCurrentPlayerName(): string | null {
  const teamId = getCurrentTeamId();
  if (!teamId) return null;
  const players = gameState.teamPlayers[teamId];
  if (!players || players.length === 0) return null;
  return players[0];
}

function getAvailableNumbers(): number[] {
  return Array.from({ length: gameState.totalQuestions }, (_, i) => i + 1)
    .filter((n) => !gameState.usedQuestionNumbers.includes(n));
}

async function buildQuestionNumberMap() {
  const questions = await storage.getQuestions();
  const activeQuestions = questions.filter((q) => q.isActive !== false);
  gameState.questionNumberMap = {};
  const limited = activeQuestions.slice(0, gameState.totalQuestions);
  limited.forEach((q, idx) => {
    gameState.questionNumberMap[idx + 1] = q.id;
  });
}

async function broadcastFullState() {
  try {
    const teams = await storage.getTeams();
    const questions = await storage.getQuestions();
    const session = gameState.sessionId ? await storage.getSession(gameState.sessionId) : null;
    const scores = gameState.sessionId ? await storage.getTeamScores(gameState.sessionId) : [];
    const answeredQuestionIds = gameState.sessionId ? await storage.getAnsweredQuestionIds(gameState.sessionId) : [];

    const currentTeamId = getCurrentTeamId();
    const currentPlayerName = getCurrentPlayerName();
    const currentQuestion = gameState.selectedQuestionId
      ? await storage.getQuestion(gameState.selectedQuestionId)
      : null;

    const currentPlayerAvailableNumbers = getAvailableNumbers();

    broadcast({
      type: "game-state",
      data: {
        session,
        scores,
        answeredQuestionIds,
        teams,
        questions,
        currentQuestion,
        timerSeconds: gameState.timerSeconds,
        phase: gameState.phase,
        currentTeamId,
        currentPlayerName,
        currentPlayerAvailableNumbers,
        usedQuestionNumbers: gameState.usedQuestionNumbers,
        teamPlayers: gameState.teamPlayers,
        entryTeams: gameState.entryTeams,
        totalQuestions: gameState.totalQuestions,
        questionsPerTeam: gameState.questionsPerTeam,
        teamQuestionsAnswered: gameState.teamQuestionsAnswered,
        currentTeamIndex: gameState.currentTeamIndex,
        teamOrder: gameState.teamOrder,
        gameError: gameState.gameError,
      },
    });
  } catch (error) {
    log(`Error broadcasting game state: ${error}`, "ws");
  }
}

async function startEntryPhase() {
  gameState.phase = "entry";
  gameState.entryTeams = [];
  gameState.gameError = null;

  startTimer(120, async () => {
    await endEntryPhase();
  });

  broadcast({ type: "phase-changed", phase: "entry" });
  await broadcastFullState();
}

async function endEntryPhase() {
  if (gameState.entryTeams.length < 2) {
    stopTimer();
    gameState.gameError = "not-enough-teams";
    gameState.phase = "finished";
    if (gameState.sessionId) {
      await storage.updateSession(gameState.sessionId, { status: "finished" });
    }
    await broadcastFullState();
    return;
  }

  const allTeams = await storage.getTeams();

  const teamPlayOrder = [
    "Ahl Al-Raya",
    "Marsa Al-Fikr",
    "Al-Fallah",
    "Falaj Gharba",
    "Al-Nukhba",
    "Al-Bidaya",
  ];

  const getPlayPriority = (teamId: number) => {
    const team = allTeams.find((t) => t.id === teamId);
    if (!team) return 99;
    const idx = teamPlayOrder.findIndex((name) => team.nameEn.includes(name));
    return idx === -1 ? 99 : idx;
  };

  gameState.teamOrder = [...gameState.entryTeams].sort(
    (a, b) => getPlayPriority(a) - getPlayPriority(b)
  );

  const teams = allTeams;
  gameState.teamPlayers = {};
  gameState.teamQuestionsAnswered = {};
  for (const team of teams) {
    if (gameState.teamOrder.includes(team.id)) {
      gameState.teamPlayers[team.id] = [team.captain, ...team.members.filter((m) => m !== team.captain)];
      gameState.teamQuestionsAnswered[team.id] = 0;
    }
  }

  await buildQuestionNumberMap();

  gameState.currentTeamIndex = 0;

  broadcast({ type: "entry-closed" });
  await startSelectionPhase();
}

async function startSelectionPhase() {
  gameState.phase = "selection";
  gameState.selectedQuestionId = null;

  const available = getAvailableNumbers();
  if (available.length === 0) {
    await endGame();
    return;
  }

  if (gameState.sessionId) {
    await storage.updateSession(gameState.sessionId, {
      currentTeamId: getCurrentTeamId(),
      currentQuestionId: null,
    });
  }

  broadcast({ type: "phase-changed", phase: "selection", currentTeamId: getCurrentTeamId(), currentPlayerName: getCurrentPlayerName() });

  startTimer(10, async () => {
    await handleSelectionTimeout();
  });

  await broadcastFullState();
}

async function handleSelectionTimeout() {
  const available = getAvailableNumbers();
  if (available.length > 0) {
    const autoPickNumber = available[0];
    await handleQuestionSelection(autoPickNumber);
  } else {
    await endGame();
  }
}

async function handleQuestionSelection(questionNumber: number) {
  const questionId = gameState.questionNumberMap[questionNumber];
  if (!questionId) {
    log(`Question number ${questionNumber} has no mapped question ID`, "ws");
    return;
  }

  if (gameState.usedQuestionNumbers.includes(questionNumber)) {
    log(`Question number ${questionNumber} already used`, "ws");
    return;
  }

  gameState.usedQuestionNumbers.push(questionNumber);
  gameState.selectedQuestionId = questionId;

  if (gameState.sessionId) {
    await storage.updateSession(gameState.sessionId, { currentQuestionId: questionId });
  }

  const question = await storage.getQuestion(questionId);
  broadcast({ type: "question-selected", question, questionId, questionNumber });

  stopTimer();
  await startPreparationPhase();
}

async function startPreparationPhase() {
  gameState.phase = "preparation";

  broadcast({ type: "phase-changed", phase: "preparation" });

  startTimer(10, async () => {
    await startAnswerPhase();
  });

  await broadcastFullState();
}

async function startAnswerPhase() {
  gameState.phase = "answer";

  broadcast({ type: "phase-changed", phase: "answer" });

  startTimer(30, async () => {
    await handleAnswerTimeout();
  });

  await broadcastFullState();
}

async function handleAnswerTimeout() {
  log(`Answer timeout fired: selectedQ=${gameState.selectedQuestionId}, session=${gameState.sessionId}`, "ws");
  if (!gameState.selectedQuestionId || !gameState.sessionId) {
    await advanceToNextPlayer();
    return;
  }

  const question = await storage.getQuestion(gameState.selectedQuestionId);
  if (!question) {
    await advanceToNextPlayer();
    return;
  }

  const teamId = getCurrentTeamId()!;

  const alreadyAnswered = await storage.getAnsweredQuestionIds(gameState.sessionId);
  if (!alreadyAnswered.includes(gameState.selectedQuestionId)) {
    await storage.createQuestionHistory({
      sessionId: gameState.sessionId,
      teamId,
      questionId: gameState.selectedQuestionId,
      answerGiven: "",
      isCorrect: false,
    });

    const teamScore = await storage.getTeamScore(gameState.sessionId, teamId);
    if (teamScore) {
      await storage.updateTeamScore(teamScore.id, {
        questionsAnswered: teamScore.questionsAnswered + 1,
      });
    }

    gameState.teamQuestionsAnswered[teamId] = (gameState.teamQuestionsAnswered[teamId] || 0) + 1;
  }

  broadcast({
    type: "answer-result",
    isCorrect: false,
    correctAnswer: question.correctAnswer,
    answerGiven: "",
    teamId,
    timeUp: true,
  });

  broadcast({ type: "time-up" });

  await storage.updateSession(gameState.sessionId, { currentQuestionId: null });
  gameState.selectedQuestionId = null;

  await broadcastFullState();

  setTimeout(async () => {
    await advanceToNextTurn();
  }, 4000);
}

async function handleAnswerSubmission(answer: string) {
  log(`Answer submission received: answer="${answer}", phase="${gameState.phase}", selectedQ=${gameState.selectedQuestionId}, session=${gameState.sessionId}`, "ws");
  if (gameState.phase !== "answer" || !gameState.selectedQuestionId || !gameState.sessionId) {
    log(`Answer rejected: phase=${gameState.phase}, selectedQ=${gameState.selectedQuestionId}, session=${gameState.sessionId}`, "ws");
    return;
  }

  stopTimer();

  const question = await storage.getQuestion(gameState.selectedQuestionId);
  if (!question) {
    log(`Answer rejected: question not found for id ${gameState.selectedQuestionId}`, "ws");
    return;
  }

  const teamId = getCurrentTeamId()!;
  const isCorrect = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
  log(`Answer check: given="${answer}", correct="${question.correctAnswer}", isCorrect=${isCorrect}, teamId=${teamId}`, "ws");

  const alreadyAnswered = await storage.getAnsweredQuestionIds(gameState.sessionId);
  if (alreadyAnswered.includes(gameState.selectedQuestionId)) return;

  await storage.createQuestionHistory({
    sessionId: gameState.sessionId,
    teamId,
    questionId: gameState.selectedQuestionId,
    answerGiven: answer,
    isCorrect,
  });

  const teamScore = await storage.getTeamScore(gameState.sessionId, teamId);
  if (teamScore) {
    await storage.updateTeamScore(teamScore.id, {
      score: teamScore.score + (isCorrect ? 1 : 0),
      questionsAnswered: teamScore.questionsAnswered + 1,
      correctAnswers: teamScore.correctAnswers + (isCorrect ? 1 : 0),
    });
  }

  gameState.teamQuestionsAnswered[teamId] = (gameState.teamQuestionsAnswered[teamId] || 0) + 1;

  broadcast({
    type: "answer-result",
    isCorrect,
    correctAnswer: question.correctAnswer,
    answerGiven: answer,
    teamId,
  });

  await storage.updateSession(gameState.sessionId, { currentQuestionId: null });
  gameState.selectedQuestionId = null;

  await broadcastFullState();

  setTimeout(async () => {
    await advanceToNextTurn();
  }, 4000);
}

async function advanceToNextTurn() {
  const teamId = getCurrentTeamId();
  if (!teamId) {
    await endGame();
    return;
  }

  const teamAnswered = (gameState.teamQuestionsAnswered[teamId] || 0);
  const availableGlobal = getAvailableNumbers();

  if (teamAnswered >= gameState.questionsPerTeam || availableGlobal.length === 0) {
    await advanceToNextTeam();
  } else {
    await startSelectionPhase();
  }
}

async function advanceToNextTeam() {
  const nextTeamIndex = gameState.currentTeamIndex + 1;
  const completedTeamId = gameState.teamOrder[gameState.currentTeamIndex];

  if (nextTeamIndex >= gameState.teamOrder.length) {
    const available = getAvailableNumbers();
    if (available.length > 0 && hasAnyTeamWithRemainingQuestions()) {
      gameState.currentTeamIndex = 0;
    } else {
      await endGame();
      return;
    }
  } else {
    gameState.currentTeamIndex = nextTeamIndex;
  }

  const nextTeamId = getCurrentTeamId()!;

  broadcast({ type: "team-completed", completedTeamId, nextTeamId });
  broadcast({ type: "turn-changed", teamId: nextTeamId });

  gameState.phase = "team-complete";
  broadcast({ type: "phase-changed", phase: "team-complete" });
  await broadcastFullState();
}

function hasAnyTeamWithRemainingQuestions(): boolean {
  return gameState.teamOrder.some(
    (teamId) => (gameState.teamQuestionsAnswered[teamId] || 0) < gameState.questionsPerTeam
  );
}

async function endGame() {
  stopTimer();
  gameState.phase = "finished";

  if (gameState.sessionId) {
    await storage.updateSession(gameState.sessionId, { status: "finished", currentQuestionId: null });
  }

  broadcast({ type: "game-finished" });
  broadcast({ type: "phase-changed", phase: "finished" });
  await broadcastFullState();
}

async function handleMessage(ws: WebSocket, raw: string) {
  try {
    const msg = JSON.parse(raw);

    switch (msg.type) {
      case "request-state": {
        const teams = await storage.getTeams();
        const questions = await storage.getQuestions();
        const session = gameState.sessionId ? await storage.getSession(gameState.sessionId) : null;
        const scores = gameState.sessionId ? await storage.getTeamScores(gameState.sessionId) : [];
        const answeredQuestionIds = gameState.sessionId ? await storage.getAnsweredQuestionIds(gameState.sessionId) : [];
        const currentQuestion = gameState.selectedQuestionId
          ? await storage.getQuestion(gameState.selectedQuestionId)
          : null;

        const currentTeamId = getCurrentTeamId();
        const currentPlayerName = getCurrentPlayerName();
        const currentPlayerAvailableNumbers = getAvailableNumbers();

        ws.send(JSON.stringify({
          type: "game-state",
          data: {
            session,
            scores,
            answeredQuestionIds,
            teams,
            questions,
            currentQuestion,
            timerSeconds: gameState.timerSeconds,
            phase: gameState.phase,
            currentTeamId,
            currentPlayerName,
            currentPlayerAvailableNumbers,
            usedQuestionNumbers: gameState.usedQuestionNumbers,
            teamPlayers: gameState.teamPlayers,
            entryTeams: gameState.entryTeams,
            totalQuestions: gameState.totalQuestions,
            questionsPerTeam: gameState.questionsPerTeam,
            teamQuestionsAnswered: gameState.teamQuestionsAnswered,
            currentTeamIndex: gameState.currentTeamIndex,
            teamOrder: gameState.teamOrder,
            gameError: gameState.gameError,
          },
        }));
        ws.send(JSON.stringify({ type: "timer-update", seconds: gameState.timerSeconds, running: gameState.timerRunning, phase: gameState.phase }));
        break;
      }

      case "admin-start": {
        const teams = await storage.getTeams();
        if (teams.length === 0) return;

        const session = await storage.createSession({
          status: "active",
          currentTeamId: teams[0].id,
          currentQuestionId: null,
          timerSeconds: 30,
        });

        for (const team of teams) {
          await storage.createTeamScore({
            teamId: team.id,
            sessionId: session.id,
            score: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
          });
        }

        gameState = {
          ...defaultGameState,
          sessionId: session.id,
          totalQuestions: Math.min(31, (await storage.getQuestions()).filter(q => q.isActive !== false).length),
        };

        broadcast({ type: "game-started" });
        await startEntryPhase();
        break;
      }

      case "admin-skip-entry": {
        if (gameState.phase === "entry") {
          stopTimer();
          await endEntryPhase();
        }
        break;
      }

      case "team-join": {
        if (gameState.phase === "entry" && msg.teamId) {
          if (!gameState.entryTeams.includes(msg.teamId)) {
            gameState.entryTeams.push(msg.teamId);
            broadcast({ type: "team-joined", teamId: msg.teamId });
            await broadcastFullState();

            const allTeams = await storage.getTeams();
            if (gameState.entryTeams.length >= allTeams.length) {
              stopTimer();
              await endEntryPhase();
            }
          }
        }
        break;
      }

      case "player-select-question": {
        if (gameState.phase !== "selection") return;

        const { questionNumber, teamId } = msg;
        const currentTeamId = getCurrentTeamId();

        if (teamId !== currentTeamId) {
          ws.send(JSON.stringify({ type: "error", message: "Not your turn" }));
          return;
        }

        const available = getAvailableNumbers();
        if (!available.includes(questionNumber)) {
          ws.send(JSON.stringify({ type: "error", message: "Question not available" }));
          return;
        }

        await handleQuestionSelection(questionNumber);
        break;
      }

      case "submit-answer": {
        log(`submit-answer received: answer="${msg.answer}", teamId=${msg.teamId}, phase=${gameState.phase}`, "ws");
        if (gameState.phase !== "answer") {
          log(`submit-answer rejected: wrong phase "${gameState.phase}"`, "ws");
          return;
        }

        const { answer, teamId: ansTeamId } = msg;
        const curTeamId = getCurrentTeamId();
        if (ansTeamId !== curTeamId) {
          log(`submit-answer rejected: team mismatch sent=${ansTeamId} current=${curTeamId}`, "ws");
          return;
        }

        await handleAnswerSubmission(answer);
        break;
      }

      case "admin-next-team": {
        if (gameState.phase === "team-complete") {
          await startSelectionPhase();
        }
        break;
      }

      case "admin-pause": {
        if (gameState.phase === "idle" || gameState.phase === "finished" || gameState.phase === "paused" || gameState.phase === "team-complete") return;
        gameState.pausedPhase = gameState.phase;
        gameState.pausedTimerSeconds = gameState.timerSeconds;
        stopTimer();
        gameState.phase = "paused";

        if (gameState.sessionId) {
          await storage.updateSession(gameState.sessionId, { status: "paused" });
        }

        broadcast({ type: "game-paused" });
        broadcast({ type: "phase-changed", phase: "paused" });
        await broadcastFullState();
        break;
      }

      case "admin-resume": {
        if (gameState.phase !== "paused" || !gameState.pausedPhase) return;
        const resumePhase = gameState.pausedPhase;
        gameState.phase = resumePhase;
        gameState.pausedPhase = null;

        if (gameState.sessionId) {
          await storage.updateSession(gameState.sessionId, { status: "active" });
        }

        broadcast({ type: "game-resumed" });
        broadcast({ type: "phase-changed", phase: resumePhase });

        if (gameState.pausedTimerSeconds > 0) {
          const timerDuration = gameState.pausedTimerSeconds;
          gameState.pausedTimerSeconds = 0;

          const getTimerCallback = () => {
            switch (resumePhase) {
              case "entry": return () => endEntryPhase();
              case "selection": return () => handleSelectionTimeout();
              case "preparation": return () => startAnswerPhase();
              case "answer": return () => handleAnswerTimeout();
              default: return () => {};
            }
          };

          startTimer(timerDuration, getTimerCallback());
        }

        await broadcastFullState();
        break;
      }

      case "admin-end": {
        await endGame();
        break;
      }

      case "admin-reset": {
        stopTimer();
        if (gameState.sessionId) {
          await storage.updateSession(gameState.sessionId, { status: "finished" });
        }
        gameState = { ...defaultGameState };
        broadcast({ type: "game-reset" });
        broadcast({ type: "phase-changed", phase: "idle" });
        await broadcastFullState();
        break;
      }

      case "admin-skip": {
        if (gameState.phase === "selection" || gameState.phase === "preparation" || gameState.phase === "answer") {
          stopTimer();
          gameState.selectedQuestionId = null;
          if (gameState.sessionId) {
            await storage.updateSession(gameState.sessionId, { currentQuestionId: null });
          }
          await advanceToNextTurn();
        }
        break;
      }

      case "admin-set-team": {
        if (gameState.phase !== "idle" && gameState.phase !== "finished") {
          const teamIdx = gameState.teamOrder.indexOf(msg.teamId);
          if (teamIdx >= 0) {
            stopTimer();
            gameState.currentTeamIndex = teamIdx;
            broadcast({ type: "turn-changed", teamId: msg.teamId });
            await startSelectionPhase();
          }
        }
        break;
      }

      case "admin-tiebreaker": {
        if (gameState.phase !== "finished" || !gameState.sessionId) return;
        const { teamIds } = msg as { teamIds: number[] };
        if (!teamIds || teamIds.length < 2) return;

        gameState.teamOrder = teamIds.filter((id) => gameState.teamPlayers[id]);
        gameState.currentTeamIndex = 0;
        for (const teamId of gameState.teamOrder) {
          gameState.teamQuestionsAnswered[teamId] = 0;
        }

        await storage.updateSession(gameState.sessionId, { status: "active" });

        broadcast({ type: "game-resumed" });
        await startSelectionPhase();
        break;
      }

      case "admin-adjust-score": {
        if (!gameState.sessionId) return;
        const teamScore = await storage.getTeamScore(gameState.sessionId, msg.teamId);
        if (!teamScore) return;
        await storage.updateTeamScore(teamScore.id, {
          score: Math.max(0, teamScore.score + msg.points),
        });
        await broadcastFullState();
        break;
      }

      case "admin-force-advance": {
        if (gameState.phase === "selection" || gameState.phase === "preparation" || gameState.phase === "answer") {
          stopTimer();
          gameState.selectedQuestionId = null;
          if (gameState.sessionId) {
            await storage.updateSession(gameState.sessionId, { currentQuestionId: null });
          }
          await advanceToNextTurn();
        } else if (gameState.phase === "team-complete") {
          await startSelectionPhase();
        }
        break;
      }
    }
  } catch (error) {
    log(`WebSocket message error: ${error}`, "ws");
  }
}

export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    log("Client connected", "ws");

    ws.on("message", (data) => {
      handleMessage(ws, data.toString());
    });

    ws.on("close", () => {
      log("Client disconnected", "ws");
    });
  });

  log("WebSocket server initialized on /ws", "ws");
}

export { broadcast, broadcastFullState as broadcastGameState, stopTimer, startTimer };
