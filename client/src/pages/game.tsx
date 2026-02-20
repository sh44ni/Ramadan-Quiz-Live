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
import { Users, Moon, ArrowLeft, Lock, Crown, Star, Sparkles } from "lucide-react";
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
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("playerToken");
      if (!token) {
        setAuthChecked(true);
        setIsAuthorized(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/verify-token", {
          headers: { "x-player-token": token },
        });
        const data = await res.json();
        setIsAuthorized(data.valid);
      } catch {
        setIsAuthorized(false);
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  const { data: teamsData, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    enabled: isAuthorized,
  });

  const { data: questionsData, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
    enabled: isAuthorized,
  });

  const { data: sessionData, isLoading: sessionLoading } = useQuery<{
    session: GameSession;
    scores: TeamScore[];
    answeredQuestionIds: number[];
  } | null>({
    queryKey: ["/api/game/current"],
    refetchInterval: 1500,
    enabled: isAuthorized,
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

  if (!authChecked) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-48 w-full rounded-md" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-52px)] ramadan-gradient relative overflow-hidden">
        <div className="mosque-silhouette opacity-15" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 relative z-10 p-6"
        >
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto">
            <Lock className="h-10 w-10 text-amber-400" />
          </div>
          <h2
            className={`text-2xl font-bold text-white ${isRTL ? "font-arabic" : ""}`}
            data-testid="text-auth-required"
          >
            {t("authRequired")}
          </h2>
          <p className={`text-blue-100/70 ${isRTL ? "font-arabic" : ""}`}>
            {t("authRequiredDesc")}
          </p>
          <Button
            onClick={() => setLocation("/login")}
            className="gold-gradient border-amber-400/30 text-white font-bold"
            data-testid="button-go-login"
          >
            <span className={isRTL ? "font-arabic" : ""}>{t("playerLogin")}</span>
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 islamic-pattern">
        <Skeleton className="h-16 w-full rounded-md" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full rounded-md" />
            <Skeleton className="h-64 w-full rounded-md" />
          </div>
          <Skeleton className="h-96 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (!session || session.status === "waiting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-52px)] ramadan-gradient relative overflow-hidden">
        <div className="mosque-silhouette opacity-15" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: `${5 + i * 10}%`, top: `${10 + (i % 4) * 20}%` }}
              animate={{ opacity: [0.1, 0.5, 0.1], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.5 }}
            >
              <Star className="h-2 w-2 text-amber-300 fill-amber-300" />
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-5 relative z-10 p-6"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Moon className="h-20 w-20 text-amber-400 fill-amber-400 mx-auto drop-shadow-lg" />
          </motion.div>
          <h2
            className={`text-3xl font-bold text-white ${isRTL ? "font-arabic" : ""}`}
            data-testid="text-waiting"
          >
            {t("waiting")}
          </h2>
          <p className={`text-blue-100/70 ${isRTL ? "font-arabic" : ""}`}>
            {t("gameWelcomeDesc")}
          </p>
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="bg-white/10 border-white/20 text-white"
            data-testid="button-back-home"
          >
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
    <div className="p-3 md:p-5 space-y-4 islamic-pattern min-h-[calc(100vh-52px)]">
      {currentTeam && (
        <motion.div
          key={currentTeam.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-0 overflow-visible">
            <div className="p-3 md:p-4">
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-md"
                style={{ backgroundColor: currentTeam.color }}
              />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: currentTeam.color }}
                  >
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-amber-500" />
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
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant="outline"
                    className="text-xs gap-1"
                    style={{ borderColor: currentTeam.color, color: currentTeam.color }}
                  >
                    <Crown className="h-3 w-3 text-amber-500" />
                    {currentTeam.captain}
                  </Badge>
                  {currentTeam.members && currentTeam.members.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-end">
                      {currentTeam.members.map((member, idx) => (
                        <span key={idx} className="text-xs text-muted-foreground font-arabic">
                          {member}{idx < currentTeam.members.length - 1 ? " ·" : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
                <Card className="p-3 md:p-4">
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
