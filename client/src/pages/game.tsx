import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { useGameSocket } from "@/lib/useGameSocket";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionDisplay } from "@/components/question-display";
import { Scoreboard } from "@/components/scoreboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Moon, ArrowLeft, Lock, Crown, Star, Sparkles, Wifi, WifiOff } from "lucide-react";
import { useLocation } from "wouter";

export default function Game() {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const [, setLocation] = useLocation();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<"correct" | "incorrect" | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [playerTeamId, setPlayerTeamId] = useState<number | null>(null);
  const [lastQuestionId, setLastQuestionId] = useState<number | null>(null);

  const { gameState, timer, answerResult, connected, submitAnswer } = useGameSocket();
  const { session, scores, teams, questions, currentQuestion, answeredQuestionIds } = gameState;
  const currentTeam = teams.find((t) => t.id === session?.currentTeamId);

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
        if (data.teamId) setPlayerTeamId(data.teamId);
      } catch {
        setIsAuthorized(false);
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentQuestion && currentQuestion.id !== lastQuestionId) {
      setLastQuestionId(currentQuestion.id);
      setSelectedAnswer(null);
      setShowResult(null);
    }
    if (!currentQuestion) {
      setLastQuestionId(null);
    }
  }, [currentQuestion, lastQuestionId]);

  useEffect(() => {
    if (answerResult) {
      setShowResult(answerResult.isCorrect ? "correct" : "incorrect");
      const timeout = setTimeout(() => {
        setShowResult(null);
        setSelectedAnswer(null);
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [answerResult]);

  useEffect(() => {
    if (isAuthorized && session?.status === "finished") {
      setLocation("/results");
    }
  }, [isAuthorized, session?.status, setLocation]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion || !session) return;
      setSelectedAnswer(answer);
      submitAnswer(answer, session.id, session.currentTeamId!, currentQuestion.id);
    },
    [currentQuestion, session, submitAnswer],
  );

  const isMyTurn = playerTeamId ? session?.currentTeamId === playerTeamId : true;

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
          <h2 className={`text-2xl font-bold text-white ${isRTL ? "font-arabic" : ""}`} data-testid="text-auth-required">
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
          <h2 className={`text-3xl font-bold text-white ${isRTL ? "font-arabic" : ""}`} data-testid="text-waiting">
            {t("waiting")}
          </h2>
          <p className={`text-blue-100/70 ${isRTL ? "font-arabic" : ""}`}>
            {t("gameWelcomeDesc")}
          </p>
          <div className="flex items-center justify-center gap-2">
            {connected ? (
              <Badge variant="secondary" className="gap-1 text-emerald-500">
                <Wifi className="h-3 w-3" /> {t("connected") || "Connected"}
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="h-3 w-3" /> {t("reconnecting") || "Reconnecting..."}
              </Badge>
            )}
          </div>
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
      <div className="flex items-center justify-between gap-2">
        {connected ? (
          <Badge variant="secondary" className="gap-1 text-emerald-500 text-xs">
            <Wifi className="h-3 w-3" /> {t("live") || "Live"}
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1 text-xs">
            <WifiOff className="h-3 w-3" /> {t("reconnecting") || "Reconnecting..."}
          </Badge>
        )}
        {session.status === "paused" && (
          <Badge variant="secondary" className="text-amber-500 gap-1">
            {t("paused")}
          </Badge>
        )}
      </div>

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
                  {!isMyTurn && (
                    <Badge variant="secondary" className="text-xs text-amber-600">
                      {t("waitingForTurn") || "Waiting for your turn..."}
                    </Badge>
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
                  <div className="flex items-center gap-4 p-2 rounded-md">
                    <div className="relative w-20 h-20 shrink-0">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="38" stroke="hsl(var(--muted))" strokeWidth="4" fill="none" />
                        <motion.circle
                          cx="40" cy="40" r="38"
                          stroke={timer.seconds > 20 ? "#10b981" : timer.seconds > 10 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="4"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 38}
                          animate={{ strokeDashoffset: (2 * Math.PI * 38) - ((timer.seconds / 30) * (2 * Math.PI * 38)) }}
                          transition={{ duration: 0.5, ease: "linear" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className={`text-2xl font-bold tabular-nums ${
                            timer.seconds > 20 ? "text-emerald-500" : timer.seconds > 10 ? "text-amber-500" : "text-red-500"
                          } ${timer.seconds <= 5 ? "animate-pulse" : ""}`}
                          data-testid="text-timer"
                        >
                          {timer.seconds}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-muted-foreground">{t("timer")}</span>
                        <span className={`text-xs font-medium ${
                          timer.seconds > 20 ? "text-emerald-500" : timer.seconds > 10 ? "text-amber-500" : "text-red-500"
                        }`}>
                          {timer.running
                            ? (timer.seconds > 20 ? t("plentyOfTime") : timer.seconds > 10 ? t("hurryUp") : t("almostOut"))
                            : t("waitingForTimer")
                          }
                        </span>
                      </div>
                      <div className="relative h-3 w-full rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full transition-colors duration-500 ${
                            timer.seconds > 20 ? "bg-emerald-500" : timer.seconds > 10 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          animate={{ width: `${(timer.seconds / 30) * 100}%` }}
                          transition={{ duration: 0.3, ease: "linear" }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
                <QuestionDisplay
                  question={currentQuestion}
                  questionNumber={questions.findIndex((q) => q.id === currentQuestion.id) + 1}
                  onAnswer={handleAnswer}
                  showResult={showResult}
                  correctAnswer={showResult ? (answerResult?.correctAnswer || currentQuestion.correctAnswer) : null}
                  disabled={!!selectedAnswer || !isMyTurn || !timer.running}
                  selectedAnswer={selectedAnswer || (answerResult?.answerGiven || null)}
                />
              </motion.div>
            ) : (
              <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="p-8 md:p-12 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-4"
                  >
                    <Sparkles className="h-12 w-12 text-amber-400/50 mx-auto" />
                  </motion.div>
                  <h3 className={`text-lg font-semibold text-muted-foreground ${isRTL ? "font-arabic" : ""}`}>
                    {isMyTurn ? t("waitingForQuestion") : t("waitingForTurn")}
                  </h3>
                  <p className={`text-sm text-muted-foreground/70 mt-2 ${isRTL ? "font-arabic" : ""}`}>
                    {t("adminWillSelectQuestion")}
                  </p>
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
