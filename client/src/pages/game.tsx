import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionGrid } from "@/components/question-grid";
import { Timer } from "@/components/timer";
import { Scoreboard } from "@/components/scoreboard";
import { QuestionDisplay } from "@/components/question-display";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Moon, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Team, Question, GameSession, TeamScore } from "@shared/schema";

export default function Game() {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const [, setLocation] = useLocation();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<"correct" | "incorrect" | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const lastQuestionIdRef = useRef<number | null>(null);

  const { data: teamsData, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: questionsData, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  const { data: sessionData, isLoading: sessionLoading } = useQuery<{
    session: GameSession;
    scores: TeamScore[];
    answeredQuestionIds: number[];
  } | null>({
    queryKey: ["/api/game/current"],
    refetchInterval: 1500,
  });

  const session = sessionData?.session || null;
  const scores = sessionData?.scores || [];
  const answeredQuestionIds = sessionData?.answeredQuestionIds || [];
  const teams = teamsData || [];
  const questions = questionsData || [];

  const currentQuestion = session?.currentQuestionId
    ? questions.find((q) => q.id === session.currentQuestionId) || null
    : null;

  useEffect(() => {
    if (currentQuestion && currentQuestion.id !== lastQuestionIdRef.current) {
      lastQuestionIdRef.current = currentQuestion.id;
      setSelectedAnswer(null);
      setShowResult(null);
      setTimerRunning(true);
      setTimerKey((k) => k + 1);
    }
    if (!currentQuestion) {
      lastQuestionIdRef.current = null;
      setTimerRunning(false);
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (session?.status === "finished") {
      setLocation("/results");
    }
  }, [session?.status, setLocation]);

  const currentTeam = teams.find((t) => t.id === session?.currentTeamId);

  const handleSelectQuestion = useCallback(
    async (questionId: number) => {
      if (!session) return;

      try {
        await apiRequest("POST", "/api/game/select-question", {
          sessionId: session.id,
          questionId,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/game/current"] });
      } catch (error) {
        console.error("Error selecting question:", error);
      }
    },
    [session],
  );

  const handleAnswer = useCallback(
    async (answer: string) => {
      if (!currentQuestion || !session) return;

      setSelectedAnswer(answer);
      setTimerRunning(false);

      try {
        const res = await apiRequest("POST", "/api/game/answer", {
          sessionId: session.id,
          questionId: currentQuestion.id,
          teamId: session.currentTeamId,
          answer,
        });
        const result = await res.json();
        setShowResult(result.isCorrect ? "correct" : "incorrect");

        setTimeout(() => {
          setShowResult(null);
          setSelectedAnswer(null);
          queryClient.invalidateQueries({ queryKey: ["/api/game/current"] });
        }, 2500);
      } catch (error) {
        console.error("Error submitting answer:", error);
      }
    },
    [currentQuestion, session],
  );

  const handleTimeUp = useCallback(() => {
    if (!currentQuestion || !session) return;

    setTimerRunning(false);

    apiRequest("POST", "/api/game/answer", {
      sessionId: session.id,
      questionId: currentQuestion.id,
      teamId: session.currentTeamId,
      answer: null,
    }).then(() => {
      setShowResult("incorrect");
      setTimeout(() => {
        setShowResult(null);
        setSelectedAnswer(null);
        queryClient.invalidateQueries({ queryKey: ["/api/game/current"] });
      }, 2500);
    });
  }, [currentQuestion, session]);

  const isLoading = teamsLoading || questionsLoading || sessionLoading;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!session || session.status === "waiting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] p-4 islamic-pattern">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <Moon className="h-16 w-16 text-amber-500 mx-auto animate-float" />
          <h2
            className={`text-2xl font-bold ${isRTL ? "font-arabic" : ""}`}
            data-testid="text-waiting"
          >
            {t("waiting")}
          </h2>
          <p className={`text-muted-foreground ${isRTL ? "font-arabic" : ""}`}>
            {t("gameWelcomeDesc")}
          </p>
          <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4" />
            <span className={isRTL ? "font-arabic" : ""}>{t("backToHome")}</span>
          </Button>
        </motion.div>
      </div>
    );
  }

  if (session?.status === "finished") {
    return null;
  }

  return (
    <div className="p-3 md:p-5 space-y-4 islamic-pattern min-h-[calc(100vh-56px)]">
      {currentTeam && (
        <motion.div
          key={currentTeam.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-3 md:p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full animate-pulse"
                  style={{ backgroundColor: currentTeam.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t("currentTeam")}</span>
                  </div>
                  <h2
                    className={`text-base md:text-lg font-bold ${isRTL ? "font-arabic" : ""}`}
                    data-testid="text-current-team"
                  >
                    {language === "ar" ? currentTeam.nameAr : currentTeam.nameEn}
                  </h2>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-xs"
                style={{ borderColor: currentTeam.color, color: currentTeam.color }}
              >
                {t("captain")}: {currentTeam.captain}
              </Badge>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="wait">
            {currentQuestion ? (
              <motion.div
                key="question"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <Card className="p-4">
                  <Timer
                    key={timerKey}
                    duration={session.timerSeconds || 30}
                    isRunning={timerRunning}
                    onTimeUp={handleTimeUp}
                  />
                </Card>
                <QuestionDisplay
                  question={currentQuestion}
                  questionNumber={
                    questions.findIndex((q) => q.id === currentQuestion.id) + 1
                  }
                  onAnswer={handleAnswer}
                  showResult={showResult}
                  correctAnswer={showResult ? currentQuestion.correctAnswer : null}
                  disabled={!!selectedAnswer}
                  selectedAnswer={selectedAnswer}
                />
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="p-4">
                  <QuestionGrid
                    questionIds={questions.map((q) => q.id)}
                    answeredQuestions={answeredQuestionIds}
                    currentQuestion={null}
                    onSelectQuestion={handleSelectQuestion}
                    disabled={session.status !== "active"}
                  />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <Scoreboard
              teams={teams}
              scores={scores}
              currentTeamId={session.currentTeamId}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
