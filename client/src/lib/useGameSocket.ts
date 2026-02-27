import { useState, useEffect, useRef, useCallback } from "react";
import type { Team, Question, GameSession, TeamScore } from "@shared/schema";

export type GamePhase = "idle" | "entry" | "selection" | "preparation" | "answer" | "paused" | "team-complete" | "finished";

export interface GameState {
  session: GameSession | null;
  scores: TeamScore[];
  answeredQuestionIds: number[];
  teams: Team[];
  questions: Question[];
  currentQuestion: Question | null;
  timerSeconds: number;
  phase: GamePhase;
  currentTeamId: number | null;
  currentPlayerName: string | null;
  currentPlayerAvailableNumbers: number[];
  usedQuestionNumbers: number[];
  teamPlayers: Record<number, string[]>;
  entryTeams: number[];
  totalQuestions: number;
  questionsPerTeam: number;
  teamQuestionsAnswered: Record<number, number>;
  currentTeamIndex: number;
  teamOrder: number[];
  gameError: string | null;
  customTeamOrder: number[];
  allTeamOrder: number[];
  matchTeamIndex: number;
}

interface TimerState {
  seconds: number;
  running: boolean;
  phase: GamePhase;
}

interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
  answerGiven: string;
  teamId: number;
  timeUp?: boolean;
}

interface TeamCompletedEvent {
  completedTeamId: number;
  nextTeamId: number;
}

const defaultState: GameState = {
  session: null,
  scores: [],
  answeredQuestionIds: [],
  teams: [],
  questions: [],
  currentQuestion: null,
  timerSeconds: 0,
  phase: "idle",
  currentTeamId: null,
  currentPlayerName: null,
  currentPlayerAvailableNumbers: [],
  usedQuestionNumbers: [],
  teamPlayers: {},
  entryTeams: [],
  totalQuestions: 31,
  questionsPerTeam: 6,
  teamQuestionsAnswered: {},
  currentTeamIndex: 0,
  teamOrder: [],
  gameError: null,
  customTeamOrder: [],
  allTeamOrder: [],
  matchTeamIndex: 0,
};

export function useGameSocket() {
  const [gameState, setGameState] = useState<GameState>(defaultState);
  const [timer, setTimer] = useState<TimerState>({ seconds: 0, running: false, phase: "idle" });
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [teamCompleted, setTeamCompleted] = useState<TeamCompletedEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "request-state" }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "game-state":
            setGameState(msg.data);
            break;
          case "timer-update":
            setTimer({ seconds: msg.seconds, running: msg.running, phase: msg.phase || "idle" });
            break;
          case "answer-result":
            setAnswerResult(msg);
            setTimeout(() => setAnswerResult(null), 4000);
            break;
          case "question-selected":
            if (msg.question) {
              setGameState((prev) => ({ ...prev, currentQuestion: msg.question }));
            }
            break;
          case "turn-changed":
            if (msg.teamId) {
              setGameState((prev) => ({
                ...prev,
                currentTeamId: msg.teamId,
                currentQuestion: null,
              }));
            }
            break;
          case "team-completed":
            setTeamCompleted({ completedTeamId: msg.completedTeamId, nextTeamId: msg.nextTeamId });
            setTimeout(() => setTeamCompleted(null), 5000);
            break;
          case "phase-changed":
            setGameState((prev) => ({ ...prev, phase: msg.phase }));
            break;
          case "team-joined":
            setGameState((prev) => ({
              ...prev,
              entryTeams: prev.entryTeams.includes(msg.teamId) ? prev.entryTeams : [...prev.entryTeams, msg.teamId],
            }));
            break;
          case "entry-closed":
            break;
          case "game-error":
            break;
          case "game-started":
            break;
          case "game-paused":
            setGameState((prev) => ({
              ...prev,
              phase: "paused",
              session: prev.session ? { ...prev.session, status: "paused" } : prev.session,
            }));
            break;
          case "game-resumed":
            setGameState((prev) => ({
              ...prev,
              session: prev.session ? { ...prev.session, status: "active" } : prev.session,
            }));
            break;
          case "game-finished":
            setGameState((prev) => ({
              ...prev,
              phase: "finished",
              session: prev.session ? { ...prev.session, status: "finished" } : prev.session,
              currentQuestion: null,
            }));
            break;
          case "game-reset":
            setGameState({ ...defaultState });
            setAnswerResult(null);
            setTeamCompleted(null);
            break;
          case "time-up":
            setTimer((prev) => ({ ...prev, seconds: 0, running: false }));
            break;
        }
      } catch (e) {
        console.error("WS parse error:", e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimeoutRef.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const selectQuestion = useCallback((questionNumber: number, teamId: number, playerName: string) => {
    send({ type: "player-select-question", questionNumber, teamId, playerName });
  }, [send]);

  const submitAnswer = useCallback((answer: string, sessionId: number, teamId: number, questionId: number) => {
    send({ type: "submit-answer", answer, sessionId, teamId, questionId });
  }, [send]);

  const joinTeam = useCallback((teamId: number) => {
    send({ type: "team-join", teamId });
  }, [send]);

  const adminStart = useCallback(() => send({ type: "admin-start" }), [send]);
  const adminPause = useCallback(() => send({ type: "admin-pause" }), [send]);
  const adminResume = useCallback(() => send({ type: "admin-resume" }), [send]);
  const adminEnd = useCallback(() => send({ type: "admin-end" }), [send]);
  const adminReset = useCallback(() => send({ type: "admin-reset" }), [send]);
  const adminSkip = useCallback(() => send({ type: "admin-skip" }), [send]);
  const adminSkipEntry = useCallback(() => send({ type: "admin-skip-entry" }), [send]);
  const adminSetTeam = useCallback((teamId: number) => send({ type: "admin-set-team", teamId }), [send]);
  const adminAdjustScore = useCallback((teamId: number, points: number) => send({ type: "admin-adjust-score", teamId, points }), [send]);
  const adminForceAdvance = useCallback(() => send({ type: "admin-force-advance" }), [send]);
  const adminTiebreaker = useCallback((teamIds: number[]) => send({ type: "admin-tiebreaker", teamIds }), [send]);
  const adminNextTeam = useCallback(() => send({ type: "admin-next-team" }), [send]);
  const adminSetTeamOrder = useCallback((teamIds: number[]) => send({ type: "admin-set-team-order", teamIds }), [send]);

  return {
    gameState,
    timer,
    answerResult,
    teamCompleted,
    connected,
    selectQuestion,
    submitAnswer,
    joinTeam,
    adminStart,
    adminPause,
    adminResume,
    adminEnd,
    adminReset,
    adminSkip,
    adminSkipEntry,
    adminSetTeam,
    adminAdjustScore,
    adminForceAdvance,
    adminTiebreaker,
    adminNextTeam,
    adminSetTeamOrder,
  };
}
