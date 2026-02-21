import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { useGameSocket } from "@/lib/useGameSocket";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Crown,
  Star,
  Users,
  Moon,
  Sparkles,
  Clock,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function Display() {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const { gameState, timer, answerResult, connected } = useGameSocket();

  const { session, scores, teams, questions, currentQuestion, answeredQuestionIds } = gameState;
  const currentTeam = teams.find((t) => t.id === session?.currentTeamId);

  useEffect(() => {
    document.title = isRTL
      ? "شاشة العرض | مسابقة رمضان الثقافية"
      : "Live Display | Ramadan Quiz Competition";
  }, [isRTL]);

  const sortedTeams = [...teams].sort((a, b) => {
    const scoreA = scores.find((s) => s.teamId === a.id)?.score || 0;
    const scoreB = scores.find((s) => s.teamId === b.id)?.score || 0;
    return scoreB - scoreA;
  });

  const maxScore = Math.max(...sortedTeams.map((t) => scores.find((s) => s.teamId === t.id)?.score || 0), 1);

  const getTimerColor = () => {
    if (timer.seconds > 20) return "text-emerald-500";
    if (timer.seconds > 10) return "text-amber-500";
    return "text-red-500";
  };

  const getTimerStroke = () => {
    if (timer.seconds > 20) return "#10b981";
    if (timer.seconds > 10) return "#f59e0b";
    return "#ef4444";
  };

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - ((timer.seconds / 30) * circumference);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-amber-400 fill-amber-400" />;
    if (index === 1) return <Star className="h-5 w-5 text-gray-400 fill-gray-400" />;
    if (index === 2) return <Star className="h-5 w-5 text-amber-600 fill-amber-600" />;
    return null;
  };

  if (!session || session.status === "waiting" || !session.status) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center ramadan-gradient relative overflow-hidden">
        <div className="mosque-silhouette opacity-15" />
        <div className="absolute top-4 right-4 z-20">
          {connected ? (
            <Badge variant="secondary" className="gap-1 text-emerald-500">
              <Wifi className="h-3 w-3" /> {t("connected") || "Live"}
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <WifiOff className="h-3 w-3" /> {t("disconnected") || "Offline"}
            </Badge>
          )}
        </div>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: `${3 + i * 7}%`, top: `${5 + (i % 5) * 18}%` }}
              animate={{ opacity: [0.1, 0.5, 0.1], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 2 + i * 0.2, repeat: Infinity, delay: i * 0.4 }}
            >
              <Star className="h-2 w-2 text-amber-300 fill-amber-300" />
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 relative z-10 p-8"
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Moon className="h-28 w-28 text-amber-400 fill-amber-400 mx-auto drop-shadow-2xl" />
          </motion.div>
          <h1 className={`text-5xl md:text-7xl font-bold text-white ${isRTL ? "font-arabic" : ""}`}>
            {t("quizTitle")}
          </h1>
          <p className={`text-2xl text-blue-100/70 ${isRTL ? "font-arabic" : ""}`}>
            {t("waiting")}
          </p>
        </motion.div>
      </div>
    );
  }

  if (session.status === "finished") {
    return (
      <div className="min-h-screen ramadan-gradient relative overflow-hidden p-6 md:p-10">
        <div className="mosque-silhouette opacity-15" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
            <Trophy className="h-20 w-20 text-amber-400 mx-auto" />
            <h1 className={`text-5xl font-bold text-white ${isRTL ? "font-arabic" : ""}`}>
              {t("gameOver")}
            </h1>
          </motion.div>

          <div className="space-y-4">
            {sortedTeams.map((team, index) => {
              const teamScore = scores.find((s) => s.teamId === team.id);
              const score = teamScore?.score || 0;
              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className={`flex items-center gap-4 p-5 rounded-xl ${
                    index === 0 ? "bg-amber-500/20 ring-2 ring-amber-400" : "bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-center w-12 shrink-0">
                    {getRankIcon(index) || (
                      <span className="text-2xl font-bold text-white/60">{index + 1}</span>
                    )}
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: team.color }}
                  >
                    <Users className="h-5 w-5" />
                  </div>
                  <span className={`text-xl font-bold text-white flex-1 ${isRTL ? "font-arabic" : ""}`}>
                    {language === "ar" ? team.nameAr : team.nameEn}
                  </span>
                  <span className="text-3xl font-bold text-amber-400">{score}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const questionText = currentQuestion
    ? language === "ar" ? currentQuestion.textAr : currentQuestion.textEn
    : null;

  const options = currentQuestion
    ? [
        { key: "a", text: language === "ar" ? currentQuestion.optionAAr : currentQuestion.optionAEn },
        { key: "b", text: language === "ar" ? currentQuestion.optionBAr : currentQuestion.optionBEn },
        { key: "c", text: language === "ar" ? currentQuestion.optionCAr : currentQuestion.optionCEn },
        { key: "d", text: language === "ar" ? currentQuestion.optionDAr : currentQuestion.optionDEn },
      ]
    : [];

  const category = currentQuestion
    ? language === "ar" ? currentQuestion.categoryAr : currentQuestion.categoryEn
    : "";

  const questionNumber = currentQuestion
    ? questions.findIndex((q) => q.id === currentQuestion.id) + 1
    : 0;

  const getOptionDisplayStyle = (key: string) => {
    if (!answerResult) return "bg-white/10 border-white/20 text-white";
    if (key === answerResult.correctAnswer) return "bg-emerald-500/30 border-emerald-400 text-emerald-200";
    if (key === answerResult.answerGiven && !answerResult.isCorrect) return "bg-red-500/30 border-red-400 text-red-200";
    return "bg-white/5 border-white/10 text-white/40";
  };

  return (
    <div className="min-h-screen ramadan-gradient relative overflow-hidden">
      <div className="mosque-silhouette opacity-10" />

      <div className="absolute top-3 right-3 z-20">
        {connected ? (
          <Badge variant="secondary" className="gap-1 text-emerald-500 bg-black/30 border-emerald-500/30">
            <Wifi className="h-3 w-3" /> {t("connected") || "Live"}
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1">
            <WifiOff className="h-3 w-3" /> {t("disconnected") || "Offline"}
          </Badge>
        )}
      </div>

      <div className="relative z-10 h-screen flex flex-col p-4 md:p-6">
        {currentTeam && (
          <motion.div
            key={currentTeam.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4 mb-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                style={{ backgroundColor: currentTeam.color }}
              >
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span className="text-xs text-white/60 uppercase tracking-wider">{t("currentTeam")}</span>
                </div>
                <h2 className={`text-xl md:text-2xl font-bold text-white ${isRTL ? "font-arabic" : ""}`} data-testid="display-current-team">
                  {language === "ar" ? currentTeam.nameAr : currentTeam.nameEn}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/50">
              <span>{answeredQuestionIds.length}/{questions.length}</span>
            </div>
          </motion.div>
        )}

        <div className="flex-1 flex gap-4 min-h-0">
          <div className="flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              {currentQuestion ? (
                <motion.div
                  key={`q-${currentQuestion.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex-1 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/10 text-white border-white/20 gap-1 text-sm">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        {t("questionNumber")}{questionNumber}
                      </Badge>
                      <Badge className="bg-white/10 text-white border-white/20 text-sm">
                        {category}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 shrink-0">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="54" stroke="rgba(255,255,255,0.15)" strokeWidth="5" fill="none" />
                          <motion.circle
                            cx="60" cy="60" r="54"
                            stroke={getTimerStroke()}
                            strokeWidth="5"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 0.5, ease: "linear" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-xl font-bold tabular-nums ${getTimerColor()} ${timer.seconds <= 5 ? "animate-pulse" : ""}`} data-testid="display-timer">
                            {timer.seconds}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 shrink-0 mt-1">
                        <HelpCircle className="h-5 w-5 text-amber-400" />
                      </div>
                      <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold text-white leading-relaxed ${isRTL ? "font-arabic text-right" : ""}`} data-testid="display-question-text">
                        {questionText}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                    {options.map((option, idx) => (
                      <motion.div
                        key={option.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`flex items-center gap-3 p-4 md:p-5 rounded-xl border-2 transition-all duration-300 ${getOptionDisplayStyle(option.key)}`}
                        data-testid={`display-option-${option.key}`}
                      >
                        <span className={`flex items-center justify-center w-10 h-10 rounded-full text-base font-bold shrink-0 ${
                          answerResult && option.key === answerResult.correctAnswer
                            ? "bg-emerald-500 text-white"
                            : answerResult && option.key === answerResult.answerGiven && !answerResult.isCorrect
                              ? "bg-red-500 text-white"
                              : "bg-white/10 text-white"
                        }`}>
                          {option.key.toUpperCase()}
                        </span>
                        <span className={`flex-1 text-base md:text-lg font-medium ${isRTL ? "font-arabic" : ""}`}>
                          {option.text}
                        </span>
                        {answerResult && option.key === answerResult.correctAnswer && (
                          <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                        )}
                        {answerResult && option.key === answerResult.answerGiven && !answerResult.isCorrect && (
                          <XCircle className="h-6 w-6 text-red-400 shrink-0" />
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <AnimatePresence>
                    {answerResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`flex items-center justify-center gap-4 p-6 rounded-xl text-center font-bold text-2xl ${
                          answerResult.isCorrect
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                            : "bg-red-500/20 text-red-300 border border-red-400/30"
                        }`}
                        data-testid="display-result"
                      >
                        {answerResult.isCorrect ? (
                          <>
                            <CheckCircle2 className="h-10 w-10" />
                            <span className={isRTL ? "font-arabic" : ""}>{t("correct")}</span>
                            <span className="text-3xl">+10</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-10 w-10" />
                            <span className={isRTL ? "font-arabic" : ""}>{t("incorrect")}</span>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  key="waiting-question"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center gap-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-16 w-16 text-amber-400/50" />
                  </motion.div>
                  <p className={`text-2xl text-white/60 font-medium ${isRTL ? "font-arabic" : ""}`} data-testid="display-waiting-selection">
                    {t("waitingForSelection") || "Waiting for team to select a question..."}
                  </p>
                  {currentTeam && (
                    <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/10">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: currentTeam.color }} />
                      <span className={`text-lg text-white font-medium ${isRTL ? "font-arabic" : ""}`}>
                        {language === "ar" ? currentTeam.nameAr : currentTeam.nameEn}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-6 gap-2 max-w-md w-full mt-4">
                    {questions.map((q, idx) => {
                      const isAnswered = answeredQuestionIds.includes(q.id);
                      return (
                        <div
                          key={q.id}
                          className={`h-10 rounded-md flex items-center justify-center text-xs font-bold ${
                            isAnswered
                              ? "bg-white/5 text-white/20"
                              : "bg-white/15 text-white/80"
                          }`}
                        >
                          {isAnswered ? "✓" : idx + 1}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-64 lg:w-80 shrink-0 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h3 className={`text-sm font-semibold text-white/60 uppercase tracking-wider ${isRTL ? "font-arabic" : ""}`}>
                {t("leaderboard")}
              </h3>
            </div>

            <div className="space-y-2 flex-1 overflow-auto">
              {sortedTeams.map((team, index) => {
                const teamScore = scores.find((s) => s.teamId === team.id);
                const isCurrent = session?.currentTeamId === team.id;
                const score = teamScore?.score || 0;
                const barWidth = maxScore > 0 ? (score / maxScore) * 100 : 0;

                return (
                  <motion.div
                    key={team.id}
                    layout
                    className={`p-3 rounded-lg transition-all ${
                      isCurrent ? "bg-white/15 ring-1 ring-amber-400/50" : "bg-white/5"
                    }`}
                    data-testid={`display-team-score-${team.id}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 shrink-0 flex justify-center">
                        {getRankIcon(index) || (
                          <span className="text-xs font-bold text-white/40">{index + 1}</span>
                        )}
                      </div>
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                      <span className={`text-sm font-semibold text-white truncate flex-1 ${isRTL ? "font-arabic" : ""}`}>
                        {language === "ar" ? team.nameAr : team.nameEn}
                      </span>
                      <motion.span
                        key={score}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        className="text-base font-bold text-amber-400 tabular-nums"
                      >
                        {score}
                      </motion.span>
                    </div>
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden ms-7">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: team.color }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
