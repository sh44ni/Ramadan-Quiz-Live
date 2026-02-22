import { useState, useEffect, useRef, useCallback } from "react";
import type { Team, Question, GameSession, TeamScore } from "@shared/schema";

export interface GameState {
  session: GameSession | null;
  scores: TeamScore[];
  answeredQuestionIds: number[];
  teams: Team[];
  questions: Question[];
  currentQuestion: Question | null;
  timerSeconds: number;
}

interface TimerState {
  seconds: number;
  running: boolean;
}

interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
  answerGiven: string;
  teamId: number;
}

interface TeamCompletedEvent {
  completedTeamId: number;
  nextTeamId: number;
}

export function useGameSocket() {
  const [gameState, setGameState] = useState<GameState>({
    session: null,
    scores: [],
    answeredQuestionIds: [],
    teams: [],
    questions: [],
    currentQuestion: null,
    timerSeconds: 30,
  });
  const [timer, setTimer] = useState<TimerState>({ seconds: 30, running: false });
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
            setTimer({ seconds: msg.seconds, running: msg.running });
            break;
          case "answer-result":
            setAnswerResult(msg);
            setTimeout(() => setAnswerResult(null), 4000);
            break;
          case "question-selected":
            break;
          case "turn-changed":
            break;
          case "team-completed":
            setTeamCompleted({ completedTeamId: msg.completedTeamId, nextTeamId: msg.nextTeamId });
            setTimeout(() => setTeamCompleted(null), 5000);
            break;
          case "game-started":
          case "game-paused":
          case "game-resumed":
          case "game-finished":
          case "game-reset":
          case "time-up":
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

  const selectQuestion = useCallback((questionId: number, sessionId: number) => {
    send({ type: "select-question", questionId, sessionId });
  }, [send]);

  const submitAnswer = useCallback((answer: string, sessionId: number, teamId: number, questionId: number) => {
    send({ type: "submit-answer", answer, sessionId, teamId, questionId });
  }, [send]);

  const adminStart = useCallback(() => send({ type: "admin-start" }), [send]);
  const adminPause = useCallback(() => send({ type: "admin-pause" }), [send]);
  const adminResume = useCallback(() => send({ type: "admin-resume" }), [send]);
  const adminEnd = useCallback(() => send({ type: "admin-end" }), [send]);
  const adminReset = useCallback(() => send({ type: "admin-reset" }), [send]);
  const adminSkip = useCallback(() => send({ type: "admin-skip" }), [send]);
  const adminSetTeam = useCallback((teamId: number) => send({ type: "admin-set-team", teamId }), [send]);
  const adminAdjustScore = useCallback((teamId: number, points: number) => send({ type: "admin-adjust-score", teamId, points }), [send]);
  const adminNextQuestion = useCallback(() => send({ type: "admin-next-question" }), [send]);
  const adminStartTimer = useCallback(() => send({ type: "admin-start-timer" }), [send]);
  const adminShowAnswer = useCallback(() => send({ type: "admin-show-answer" }), [send]);
  const adminResetTimer = useCallback(() => send({ type: "admin-reset-timer" }), [send]);

  return {
    gameState,
    timer,
    answerResult,
    teamCompleted,
    connected,
    selectQuestion,
    submitAnswer,
    adminStart,
    adminPause,
    adminResume,
    adminEnd,
    adminReset,
    adminSkip,
    adminSetTeam,
    adminAdjustScore,
    adminNextQuestion,
    adminStartTimer,
    adminShowAnswer,
    adminResetTimer,
  };
}
