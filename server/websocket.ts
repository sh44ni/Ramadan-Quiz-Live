import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "./storage";
import { log } from "./index";

interface GameState {
  session: any;
  scores: any[];
  answeredQuestionIds: number[];
  teams: any[];
  questions: any[];
  currentQuestion: any | null;
  timerSeconds: number;
}

type WSMessage =
  | { type: "select-question"; questionId: number; sessionId: number }
  | { type: "submit-answer"; answer: string; sessionId: number; teamId: number; questionId: number }
  | { type: "admin-start" }
  | { type: "admin-pause" }
  | { type: "admin-resume" }
  | { type: "admin-end" }
  | { type: "admin-reset" }
  | { type: "admin-skip" }
  | { type: "admin-set-team"; teamId: number }
  | { type: "admin-adjust-score"; teamId: number; points: number }
  | { type: "admin-next-question" }
  | { type: "admin-select-specific-question"; questionId: number }
  | { type: "admin-start-timer" }
  | { type: "admin-show-answer" }
  | { type: "admin-reset-timer" }
  | { type: "request-state" };

let wss: WebSocketServer;
let timerInterval: ReturnType<typeof setInterval> | null = null;
let currentTimerSeconds = 30;
let timerRunning = false;
let teamAdvanceInProgress = false;

function broadcast(data: any) {
  if (!wss) return;
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function startTimer(duration: number) {
  stopTimer();
  currentTimerSeconds = duration;
  timerRunning = true;
  broadcast({ type: "timer-update", seconds: currentTimerSeconds, running: true });

  timerInterval = setInterval(() => {
    currentTimerSeconds--;
    broadcast({ type: "timer-update", seconds: currentTimerSeconds, running: true });

    if (currentTimerSeconds <= 0) {
      stopTimer();
      broadcast({ type: "timer-update", seconds: 0, running: false });
      broadcast({ type: "time-up" });
      handleTimeUp();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerRunning = false;
}

const QUESTIONS_PER_TEAM = 5;

async function getTeamQuestionCount(sessionId: number, teamId: number): Promise<number> {
  const history = await storage.getQuestionHistory(sessionId);
  return history.filter((h) => h.teamId === teamId).length;
}

async function getNextSequentialQuestion(sessionId: number): Promise<any | null> {
  const session = await storage.getActiveSession();
  if (!session) return null;

  const teams = await storage.getTeams();
  const currentTeamIndex = teams.findIndex((t) => t.id === session.currentTeamId);
  if (currentTeamIndex === -1) return null;

  const answeredIds = await storage.getAnsweredQuestionIds(sessionId);
  const allQuestions = await storage.getQuestions();

  const startIdx = currentTeamIndex * QUESTIONS_PER_TEAM;
  const endIdx = startIdx + QUESTIONS_PER_TEAM;
  const teamQuestions = allQuestions.slice(startIdx, endIdx);

  const unansweredTeamQ = teamQuestions.filter((q) => !answeredIds.includes(q.id));
  if (unansweredTeamQ.length > 0) return unansweredTeamQ[0];

  const allUnanswered = allQuestions.filter((q) => !answeredIds.includes(q.id));
  if (allUnanswered.length === 0) return null;
  return allUnanswered[0];
}

async function checkTeamCompletionAndAdvance(sessionId: number, teamId: number): Promise<boolean> {
  if (teamAdvanceInProgress) return false;

  const count = await getTeamQuestionCount(sessionId, teamId);
  if (count >= QUESTIONS_PER_TEAM) {
    teamAdvanceInProgress = true;

    const session = await storage.getActiveSession();
    if (!session) { teamAdvanceInProgress = false; return true; }

    const teams = await storage.getTeams();
    const currentIndex = teams.findIndex((t) => t.id === teamId);
    const nextTeam = teams[(currentIndex + 1) % teams.length];

    const answeredIds = await storage.getAnsweredQuestionIds(sessionId);
    const allQuestions = await storage.getQuestions();

    const totalExpected = teams.length * QUESTIONS_PER_TEAM;
    if (answeredIds.length >= totalExpected || answeredIds.length >= allQuestions.length) {
      await storage.updateSession(sessionId, { status: "finished", currentQuestionId: null });
      broadcast({ type: "game-finished" });
    } else {
      await storage.updateSession(sessionId, {
        currentTeamId: nextTeam.id,
        currentQuestionId: null,
      });
      broadcast({
        type: "team-completed",
        completedTeamId: teamId,
        nextTeamId: nextTeam.id,
      });
      broadcast({ type: "turn-changed", teamId: nextTeam.id });
    }

    await broadcastGameState();
    teamAdvanceInProgress = false;
    return true;
  }
  return false;
}

async function handleTimeUp() {
  try {
    const session = await storage.getActiveSession();
    if (!session || !session.currentQuestionId) return;

    const alreadyAnswered = await storage.getAnsweredQuestionIds(session.id);
    if (alreadyAnswered.includes(session.currentQuestionId)) return;

    const question = await storage.getQuestion(session.currentQuestionId);
    if (!question) return;

    const teamId = session.currentTeamId!;
    const sessionId = session.id;

    await storage.createQuestionHistory({
      sessionId,
      teamId,
      questionId: session.currentQuestionId,
      answerGiven: "",
      isCorrect: false,
    });

    const teamScore = await storage.getTeamScore(sessionId, teamId);
    if (teamScore) {
      await storage.updateTeamScore(teamScore.id, {
        questionsAnswered: teamScore.questionsAnswered + 1,
      });
    }

    await storage.updateSession(sessionId, { currentQuestionId: null });

    broadcast({
      type: "answer-result",
      isCorrect: false,
      correctAnswer: question.correctAnswer,
      answerGiven: "",
      teamId,
    });

    await broadcastGameState();

    setTimeout(async () => {
      const advanced = await checkTeamCompletionAndAdvance(sessionId, teamId);
      if (!advanced) {
        await broadcastGameState();
      }
    }, 4000);
  } catch (error) {
    log(`Error handling time-up: ${error}`, "ws");
  }
}

async function advanceToNextTeam(sessionId: number) {
  const session = await storage.getActiveSession();
  if (!session) return;

  const teams = await storage.getTeams();
  const currentIndex = teams.findIndex((t) => t.id === session.currentTeamId);
  const nextTeam = teams[(currentIndex + 1) % teams.length];

  const answeredIds = await storage.getAnsweredQuestionIds(sessionId);
  const allQuestions = await storage.getQuestions();

  if (answeredIds.length >= allQuestions.length) {
    await storage.updateSession(sessionId, { status: "finished", currentQuestionId: null });
    broadcast({ type: "game-finished" });
  } else {
    await storage.updateSession(sessionId, {
      currentTeamId: nextTeam.id,
      currentQuestionId: null,
    });
    broadcast({ type: "turn-changed", teamId: nextTeam.id });
  }

  await broadcastGameState();
}

async function broadcastGameState() {
  try {
    const session = await storage.getActiveSession();
    const teams = await storage.getTeams();
    const questions = await storage.getQuestions();

    if (!session) {
      broadcast({ type: "game-state", data: { session: null, scores: [], answeredQuestionIds: [], teams, questions, currentQuestion: null, timerSeconds: currentTimerSeconds } });
      return;
    }

    const scores = await storage.getTeamScores(session.id);
    const answeredQuestionIds = await storage.getAnsweredQuestionIds(session.id);
    const currentQuestion = session.currentQuestionId
      ? await storage.getQuestion(session.currentQuestionId)
      : null;

    const state: GameState = {
      session,
      scores,
      answeredQuestionIds,
      teams,
      questions,
      currentQuestion,
      timerSeconds: currentTimerSeconds,
    };

    broadcast({ type: "game-state", data: state });
  } catch (error) {
    log(`Error broadcasting game state: ${error}`, "ws");
  }
}

async function handleMessage(ws: WebSocket, raw: string) {
  try {
    const msg: WSMessage = JSON.parse(raw);

    switch (msg.type) {
      case "request-state": {
        const session = await storage.getActiveSession();
        const teams = await storage.getTeams();
        const questions = await storage.getQuestions();

        if (!session) {
          ws.send(JSON.stringify({ type: "game-state", data: { session: null, scores: [], answeredQuestionIds: [], teams, questions, currentQuestion: null, timerSeconds: 30 } }));
          return;
        }

        const scores = await storage.getTeamScores(session.id);
        const answeredQuestionIds = await storage.getAnsweredQuestionIds(session.id);
        const currentQuestion = session.currentQuestionId ? await storage.getQuestion(session.currentQuestionId) : null;

        ws.send(JSON.stringify({
          type: "game-state",
          data: { session, scores, answeredQuestionIds, teams, questions, currentQuestion, timerSeconds: currentTimerSeconds },
        }));
        ws.send(JSON.stringify({ type: "timer-update", seconds: currentTimerSeconds, running: timerRunning }));
        break;
      }

      case "select-question": {
        const { questionId, sessionId } = msg;
        await storage.updateSession(sessionId, { currentQuestionId: questionId });
        const question = await storage.getQuestion(questionId);

        broadcast({ type: "question-selected", question, questionId });
        currentTimerSeconds = 30;
        broadcast({ type: "timer-update", seconds: 30, running: false });
        await broadcastGameState();
        break;
      }

      case "admin-next-question": {
        const session = await storage.getActiveSession();
        if (!session) return;
        stopTimer();

        const currentTeamId = session.currentTeamId!;
        const teamQCount = await getTeamQuestionCount(session.id, currentTeamId);
        if (teamQCount >= QUESTIONS_PER_TEAM) {
          const advanced = await checkTeamCompletionAndAdvance(session.id, currentTeamId);
          if (advanced) return;
        }

        const nextQ = await getNextSequentialQuestion(session.id);
        if (!nextQ) {
          await storage.updateSession(session.id, { status: "finished", currentQuestionId: null });
          broadcast({ type: "game-finished" });
          await broadcastGameState();
          return;
        }

        await storage.updateSession(session.id, { currentQuestionId: nextQ.id });
        currentTimerSeconds = 30;
        broadcast({ type: "question-selected", question: nextQ, questionId: nextQ.id });
        broadcast({ type: "timer-update", seconds: 30, running: false });
        await broadcastGameState();
        break;
      }

      case "admin-select-specific-question": {
        const session = await storage.getActiveSession();
        if (!session) return;
        stopTimer();

        const question = await storage.getQuestion(msg.questionId);
        if (!question) return;

        await storage.updateSession(session.id, { currentQuestionId: question.id });
        currentTimerSeconds = 30;
        broadcast({ type: "question-selected", question, questionId: question.id });
        broadcast({ type: "timer-update", seconds: 30, running: false });
        await broadcastGameState();
        break;
      }

      case "admin-start-timer": {
        const session = await storage.getActiveSession();
        if (!session || !session.currentQuestionId) return;
        startTimer(currentTimerSeconds > 0 ? currentTimerSeconds : 30);
        break;
      }

      case "admin-reset-timer": {
        stopTimer();
        currentTimerSeconds = 30;
        broadcast({ type: "timer-update", seconds: 30, running: false });
        break;
      }

      case "admin-show-answer": {
        const session = await storage.getActiveSession();
        if (!session || !session.currentQuestionId) return;
        stopTimer();

        const alreadyAnswered = await storage.getAnsweredQuestionIds(session.id);
        if (alreadyAnswered.includes(session.currentQuestionId)) return;

        const question = await storage.getQuestion(session.currentQuestionId);
        if (!question) return;

        const showTeamId = session.currentTeamId!;
        const showSessionId = session.id;

        await storage.createQuestionHistory({
          sessionId: showSessionId,
          teamId: showTeamId,
          questionId: session.currentQuestionId,
          answerGiven: "",
          isCorrect: false,
        });

        const teamScore = await storage.getTeamScore(showSessionId, showTeamId);
        if (teamScore) {
          await storage.updateTeamScore(teamScore.id, {
            questionsAnswered: teamScore.questionsAnswered + 1,
          });
        }

        await storage.updateSession(showSessionId, { currentQuestionId: null });

        broadcast({
          type: "answer-result",
          isCorrect: false,
          correctAnswer: question.correctAnswer,
          answerGiven: "",
          teamId: showTeamId,
        });

        await broadcastGameState();

        setTimeout(async () => {
          const advanced = await checkTeamCompletionAndAdvance(showSessionId, showTeamId);
          if (!advanced) {
            await broadcastGameState();
          }
        }, 4000);
        break;
      }

      case "submit-answer": {
        const { answer, sessionId, teamId, questionId } = msg;
        stopTimer();

        const alreadyAnswered = await storage.getAnsweredQuestionIds(sessionId);
        if (alreadyAnswered.includes(questionId)) return;

        const question = await storage.getQuestion(questionId);
        if (!question) return;

        const isCorrect = answer === question.correctAnswer;

        await storage.createQuestionHistory({
          sessionId,
          teamId,
          questionId,
          answerGiven: answer,
          isCorrect,
        });

        const teamScore = await storage.getTeamScore(sessionId, teamId);
        if (teamScore) {
          await storage.updateTeamScore(teamScore.id, {
            score: teamScore.score + (isCorrect ? 1 : 0),
            questionsAnswered: teamScore.questionsAnswered + 1,
            correctAnswers: teamScore.correctAnswers + (isCorrect ? 1 : 0),
          });
        }

        await storage.updateSession(sessionId, { currentQuestionId: null });

        broadcast({
          type: "answer-result",
          isCorrect,
          correctAnswer: question.correctAnswer,
          answerGiven: answer,
          teamId,
        });

        await broadcastGameState();

        setTimeout(async () => {
          const advanced = await checkTeamCompletionAndAdvance(sessionId, teamId);
          if (!advanced) {
            await broadcastGameState();
          }
        }, 4000);
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

        currentTimerSeconds = 30;
        broadcast({ type: "game-started" });
        await broadcastGameState();
        break;
      }

      case "admin-pause": {
        const session = await storage.getActiveSession();
        if (!session) return;
        stopTimer();
        await storage.updateSession(session.id, { status: "paused" });
        broadcast({ type: "game-paused" });
        await broadcastGameState();
        break;
      }

      case "admin-resume": {
        const session = await storage.getActiveSession();
        if (!session) return;
        await storage.updateSession(session.id, { status: "active" });
        broadcast({ type: "game-resumed" });
        if (session.currentQuestionId && currentTimerSeconds > 0) {
          startTimer(currentTimerSeconds);
        }
        await broadcastGameState();
        break;
      }

      case "admin-end": {
        stopTimer();
        const session = await storage.getActiveSession();
        if (!session) return;
        await storage.updateSession(session.id, { status: "finished" });
        broadcast({ type: "game-finished" });
        await broadcastGameState();
        break;
      }

      case "admin-reset": {
        stopTimer();
        currentTimerSeconds = 30;
        const session = await storage.getActiveSession();
        if (session) {
          await storage.updateSession(session.id, { status: "finished" });
        }
        broadcast({ type: "game-reset" });
        await broadcastGameState();
        break;
      }

      case "admin-skip": {
        stopTimer();
        const session = await storage.getActiveSession();
        if (!session) return;

        await storage.updateSession(session.id, {
          currentQuestionId: null,
        });

        await advanceToNextTeam(session.id);
        break;
      }

      case "admin-set-team": {
        const session = await storage.getActiveSession();
        if (!session) return;
        stopTimer();
        await storage.updateSession(session.id, {
          currentTeamId: msg.teamId,
          currentQuestionId: null,
        });
        broadcast({ type: "turn-changed", teamId: msg.teamId });
        await broadcastGameState();
        break;
      }

      case "admin-adjust-score": {
        const session = await storage.getActiveSession();
        if (!session) return;
        const teamScore = await storage.getTeamScore(session.id, msg.teamId);
        if (!teamScore) return;
        await storage.updateTeamScore(teamScore.id, {
          score: Math.max(0, teamScore.score + msg.points),
        });
        await broadcastGameState();
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

export { broadcast, broadcastGameState, stopTimer, startTimer };
