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
import {
  Users,
  Moon,
  ArrowLeft,
  Lock,
  Crown,
  Star,
  Sparkles,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  XCircle,
  Zap,
  User,
  Hash,
  Eye,
  BookOpen,
} from "lucide-react";
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
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [lastQuestionId, setLastQuestionId] = useState<number | null>(null);

  const { gameState, timer, answerResult, connected, submitAnswer, selectQuestion, joinTeam } = useGameSocket();
  const { session, scores, teams, currentQuestion, phase, currentTeamId, currentPlayerName, usedQuestionNumbers, teamPlayers, entryTeams, totalQuestions, questionsPerTeam, teamQuestionsAnswered } = gameState;
  const currentTeam = teams.find((t) => t.id === currentTeamId);
  const allNumbers = Array.from({ length: totalQuestions }, (_, i) => i + 1);

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
        if (data.playerName || data.name) setPlayerName(data.playerName || data.name);
      } catch {
        setIsAuthorized(false);
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (phase === "entry" && playerTeamId && !entryTeams.includes(playerTeamId)) {
      joinTeam(playerTeamId);
    }
  }, [phase, playerTeamId, entryTeams, joinTeam]);

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
      if (!currentQuestion || !session || phase !== "answer") return;
      setSelectedAnswer(answer);
      submitAnswer(answer, session.id, currentTeamId!, currentQuestion.id);
    },
    [currentQuestion, session, submitAnswer, currentTeamId, phase],
  );

  const handleSelectQuestionNumber = useCallback(
    (questionNumber: number) => {
      if (!playerTeamId || phase !== "selection") return;
      selectQuestion(questionNumber, playerTeamId, playerName || "");
    },
    [playerTeamId, playerName, phase, selectQuestion],
  );

  const isMyTurn = playerTeamId === currentTeamId;
  const isMyTeamTurn = playerTeamId === currentTeamId;
  const playerTeam = teams.find((t) => t.id === playerTeamId);

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

  if (phase === "idle" || !session) {
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
          {playerName && (
            <h2 className={`text-2xl font-bold text-amber-300 ${isRTL ? "font-arabic" : ""}`} data-testid="text-welcome-player">
              {t("welcomePlayer", { name: playerName })}
            </h2>
          )}
          {playerTeam && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: playerTeam.color }} />
              <span className={`text-lg text-white/80 ${isRTL ? "font-arabic" : ""}`} data-testid="text-player-team">
                {language === "ar" ? playerTeam.nameAr : playerTeam.nameEn}
              </span>
            </div>
          )}
          <h2 className={`text-3xl font-bold text-white ${isRTL ? "font-arabic" : ""}`} data-testid="text-waiting">
            {t("waiting")}
          </h2>
          <p className={`text-blue-100/70 ${isRTL ? "font-arabic" : ""}`}>
            {t("gameWelcomeDesc")}
          </p>
          <div className="flex items-center justify-center gap-2">
            {connected ? (
              <Badge variant="secondary" className="gap-1 text-emerald-500">
                <Wifi className="h-3 w-3" /> {t("connected")}
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="h-3 w-3" /> {t("reconnecting")}
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

  if (phase === "entry") {
    const myTeamJoined = playerTeamId ? entryTeams.includes(playerTeamId) : false;
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-52px)] ramadan-gradient relative overflow-hidden">
        <div className="mosque-silhouette opacity-15" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 relative z-10 p-6 max-w-md"
        >
          <div className="relative w-28 h-28 mx-auto">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
              <motion.circle
                cx="60" cy="60" r="54"
                stroke="#f59e0b"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 54}
                animate={{ strokeDashoffset: (2 * Math.PI * 54) - ((timer.seconds / 60) * (2 * Math.PI * 54)) }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-amber-400 tabular-nums" data-testid="text-entry-timer">
                {timer.seconds}
              </span>
            </div>
          </div>

          {playerName && (
            <h2 className={`text-xl font-bold text-amber-300 ${isRTL ? "font-arabic" : ""}`} data-testid="text-entry-welcome">
              {t("welcomePlayer", { name: playerName })}
            </h2>
          )}
          {playerTeam && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: playerTeam.color }} />
              <span className={`text-base text-white/80 ${isRTL ? "font-arabic" : ""}`}>
                {language === "ar" ? playerTeam.nameAr : playerTeam.nameEn}
              </span>
            </div>
          )}
          <h2 className={`text-2xl font-bold text-white ${isRTL ? "font-arabic" : ""}`} data-testid="text-entry-phase">
            {t("entryPhase")}
          </h2>
          <p className={`text-blue-100/70 ${isRTL ? "font-arabic" : ""}`}>
            {t("entryPhaseDesc")}
          </p>

          {myTeamJoined ? (
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 gap-2 text-base px-4 py-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className={isRTL ? "font-arabic" : ""}>{t("teamJoined")}</span>
            </Badge>
          ) : (
            <Button
              onClick={() => playerTeamId && joinTeam(playerTeamId)}
              className="gold-gradient border-amber-400/30 text-white font-bold text-lg px-8 py-3"
              disabled={!playerTeamId}
              data-testid="button-join-team"
            >
              <Users className="h-5 w-5" />
              <span className={isRTL ? "font-arabic" : ""}>{t("joinGame")}</span>
            </Button>
          )}

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs text-white/50">{t("teamsJoined")}:</span>
            <span className="text-sm font-bold text-amber-400">{entryTeams.length}/6</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === "finished") {
    return null;
  }

  const getPhaseLabel = () => {
    switch (phase) {
      case "selection": return t("phaseSelection");
      case "preparation": return t("phasePreparation");
      case "answer": return t("phaseAnswer");
      case "paused": return t("paused");
      default: return "";
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case "selection": return "bg-blue-500";
      case "preparation": return "bg-amber-500";
      case "answer": return "bg-emerald-500";
      case "paused": return "bg-orange-500";
      default: return "bg-muted";
    }
  };

  const getTimerMax = () => {
    switch (phase) {
      case "selection": return 60;
      case "preparation": return 30;
      case "answer": return 30;
      default: return 30;
    }
  };

  return (
    <div className="p-3 md:p-5 space-y-4 islamic-pattern min-h-[calc(100vh-52px)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {connected ? (
            <Badge variant="secondary" className="gap-1 text-emerald-500 text-xs">
              <Wifi className="h-3 w-3" /> {t("live")}
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1 text-xs">
              <WifiOff className="h-3 w-3" /> {t("reconnecting")}
            </Badge>
          )}
          <Badge className={`text-xs gap-1 text-white ${getPhaseColor()}`}>
            <Clock className="h-3 w-3" />
            {getPhaseLabel()}
          </Badge>
        </div>
        <Badge variant="outline" className="text-xs gap-1">
          <Hash className="h-3 w-3" />
          {usedQuestionNumbers.length}/{gameState.totalQuestions}
        </Badge>
      </div>

      {currentTeam && (
        <motion.div
          key={`${currentTeamId}-${currentPlayerName}`}
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
                  {currentTeamId && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Hash className="h-3 w-3" />
                      <span>{teamQuestionsAnswered[currentTeamId] || 0}/{questionsPerTeam}</span>
                    </Badge>
                  )}
                  {currentPlayerName && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <User className="h-3 w-3" />
                      <span className="font-arabic">{currentPlayerName}</span>
                    </Badge>
                  )}
                  {isMyTurn ? (
                    <Badge className="text-xs bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1">
                      <Zap className="h-3 w-3" />
                      {t("yourTurn")}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs text-amber-600">
                      {t("waitingForTurn")}
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
                    animate={{ strokeDashoffset: (2 * Math.PI * 38) - ((timer.seconds / getTimerMax()) * (2 * Math.PI * 38)) }}
                    transition={{ duration: 0.5, ease: "linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={`text-2xl font-bold tabular-nums ${
                      timer.seconds > 20 ? "text-emerald-500" : timer.seconds > 10 ? "text-amber-500" : "text-red-500"
                    } ${timer.seconds <= 5 && timer.running ? "animate-pulse" : ""}`}
                    data-testid="text-timer"
                  >
                    {timer.seconds}
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">{getPhaseLabel()}</span>
                  <span className={`text-xs font-medium ${
                    timer.seconds > 20 ? "text-emerald-500" : timer.seconds > 10 ? "text-amber-500" : "text-red-500"
                  }`}>
                    {timer.running
                      ? (timer.seconds > 20 ? t("plentyOfTime") : timer.seconds > 10 ? t("hurryUp") : t("almostOut"))
                      : ""
                    }
                  </span>
                </div>
                <div className="relative h-3 w-full rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full transition-colors duration-500 ${
                      timer.seconds > 20 ? "bg-emerald-500" : timer.seconds > 10 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    animate={{ width: `${(timer.seconds / getTimerMax()) * 100}%` }}
                    transition={{ duration: 0.3, ease: "linear" }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <AnimatePresence mode="wait">
            {phase === "selection" && (
              <motion.div
                key="selection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="p-4 md:p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Hash className="h-5 w-5 text-amber-500" />
                      <h3 className={`text-lg font-bold ${isRTL ? "font-arabic" : ""}`} data-testid="text-select-question-title">
                        {isMyTurn ? t("selectYourNumber") : t("waitingForSelection")}
                      </h3>
                    </div>
                    {isMyTurn && (
                      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1">
                        <Zap className="h-3 w-3" />
                        {t("tapToSelect")}
                      </Badge>
                    )}
                  </div>

                  {isMyTurn ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2" data-testid="question-number-grid">
                      {allNumbers.map((num) => {
                        const isUsed = usedQuestionNumbers.includes(num);
                        return (
                          <motion.button
                            key={num}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: num * 0.01 }}
                            onClick={() => !isUsed && handleSelectQuestionNumber(num)}
                            disabled={isUsed}
                            className={`aspect-square rounded-xl border-2 text-xl font-bold transition-all ${
                              isUsed
                                ? "bg-muted/30 border-transparent opacity-40 cursor-not-allowed text-muted-foreground"
                                : "bg-card border-amber-400/40 hover:border-amber-400 hover:bg-amber-500/10 hover:shadow-lg cursor-pointer active:scale-95 text-foreground"
                            }`}
                            data-testid={`button-question-number-${num}`}
                          >
                            {isUsed ? (
                              <CheckCircle2 className="h-5 w-5 mx-auto text-muted-foreground" />
                            ) : (
                              num
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Eye className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                      <p className={`text-muted-foreground ${isRTL ? "font-arabic" : ""}`}>
                        {isMyTeamTurn
                          ? `${currentPlayerName} ${t("isSelectingQuestion")}`
                          : t("waitingForTurn")
                        }
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {phase === "preparation" && currentQuestion && (
              <motion.div
                key="preparation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="p-4 md:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="h-5 w-5 text-amber-500" />
                    <h3 className={`text-lg font-bold ${isRTL ? "font-arabic" : ""}`}>
                      {t("phasePreparation")}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {t("readQuestion")}
                    </Badge>
                  </div>
                  <QuestionDisplay
                    question={currentQuestion}
                    questionNumber={0}
                    onAnswer={() => {}}
                    showResult={null}
                    correctAnswer={null}
                    disabled={true}
                    selectedAnswer={null}
                  />
                </Card>
              </motion.div>
            )}

            {phase === "answer" && currentQuestion && (
              <motion.div
                key="answer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <QuestionDisplay
                  question={currentQuestion}
                  questionNumber={0}
                  onAnswer={handleAnswer}
                  showResult={showResult}
                  correctAnswer={showResult ? (answerResult?.correctAnswer || currentQuestion.correctAnswer) : null}
                  disabled={!!selectedAnswer || !isMyTurn || phase !== "answer"}
                  selectedAnswer={selectedAnswer || (answerResult?.answerGiven || null)}
                />
              </motion.div>
            )}

            {phase === "paused" && (
              <motion.div
                key="paused"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="p-8 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-amber-500" />
                  <h3 className={`text-xl font-bold ${isRTL ? "font-arabic" : ""}`}>
                    {t("paused")}
                  </h3>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          {currentTeam && teamPlayers[currentTeam.id] && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-amber-500" />
                <span className={`text-sm font-semibold ${isRTL ? "font-arabic" : ""}`}>
                  {language === "ar" ? currentTeam.nameAr : currentTeam.nameEn}
                </span>
              </div>
              <div className="space-y-1.5">
                {teamPlayers[currentTeam.id].map((member, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: currentTeam.color }}
                    />
                    <span className={`text-sm font-arabic ${idx === 0 ? "font-semibold text-amber-600" : "text-muted-foreground"}`}>
                      {member}
                    </span>
                    {idx === 0 && (
                      <Badge variant="outline" className="text-xs ml-auto py-0">
                        <Crown className="h-3 w-3 text-amber-500" />
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card className="p-4">
            <Scoreboard
              teams={teams}
              scores={scores}
              currentTeamId={currentTeamId}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
