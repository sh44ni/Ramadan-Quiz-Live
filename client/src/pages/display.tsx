import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { useGameSocket } from "@/lib/useGameSocket";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Crown,
  Star,
  Users,
  Moon,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function Display() {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const { gameState, timer, answerResult, teamCompleted, connected } = useGameSocket();

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
    if (timer.seconds > 20) return "text-emerald-400";
    if (timer.seconds > 10) return "text-amber-400";
    return "text-red-400";
  };

  const getTimerStroke = () => {
    if (timer.seconds > 20) return "#10b981";
    if (timer.seconds > 10) return "#f59e0b";
    return "#ef4444";
  };

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - ((timer.seconds / 30) * circumference);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-7 w-7 text-amber-400 fill-amber-400" />;
    if (index === 1) return <Star className="h-6 w-6 text-gray-300 fill-gray-300" />;
    if (index === 2) return <Star className="h-6 w-6 text-amber-600 fill-amber-600" />;
    return null;
  };

  if (!session || session.status === "waiting" || !session.status) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a1628 0%, #122a4f 40%, #1a3a6e 70%, #c8873a 100%)" }}>
        <div className="absolute top-3 right-3 z-20">
          {connected ? (
            <Badge variant="secondary" className="gap-1 text-emerald-400 bg-black/40 border-emerald-500/30">
              <Wifi className="h-3 w-3" /> {t("connected") || "Live"}
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1 bg-red-900/60">
              <WifiOff className="h-3 w-3" /> {t("disconnected") || "Offline"}
            </Badge>
          )}
        </div>

        <div className="w-full">
          <img
            src="/images/ramadan-banner.jpeg"
            alt="Ramadan Competition Banner"
            className="w-full h-auto"
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{ left: `${2 + i * 5}%`, top: `${5 + (i % 6) * 15}%` }}
                animate={{ opacity: [0.1, 0.6, 0.1], scale: [0.8, 1.4, 0.8] }}
                transition={{ duration: 2 + i * 0.15, repeat: Infinity, delay: i * 0.3 }}
              >
                <Star className="h-1.5 w-1.5 text-amber-300 fill-amber-300" />
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <p className="text-2xl md:text-3xl text-amber-200/80 font-arabic" data-testid="display-waiting-text">
                {t("waiting")}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (session.status === "finished") {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a1628 0%, #122a4f 50%, #1a3a6e 100%)" }}>
        <div className="w-full">
          <img
            src="/images/ramadan-banner.jpeg"
            alt="Ramadan Competition Banner"
            className="w-full h-auto"
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-8 space-y-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
            <Trophy className="h-20 w-20 text-amber-400 mx-auto drop-shadow-lg" />
            <h1 className={`text-5xl md:text-6xl font-bold text-white ${isRTL ? "font-arabic" : ""}`}>
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
                  className={`flex items-center gap-5 p-5 md:p-6 rounded-2xl backdrop-blur-sm ${
                    index === 0 ? "bg-amber-500/20 ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/10" : "bg-white/8 border border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-center w-14 shrink-0">
                    {getRankIcon(index) || (
                      <span className="text-3xl font-bold text-white/50">{index + 1}</span>
                    )}
                  </div>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg"
                    style={{ backgroundColor: team.color }}
                  >
                    <Users className="h-6 w-6" />
                  </div>
                  <span className={`text-2xl md:text-3xl font-bold text-white flex-1 ${isRTL ? "font-arabic" : ""}`}>
                    {language === "ar" ? team.nameAr : team.nameEn}
                  </span>
                  <div className="text-right">
                    <span className="text-4xl md:text-5xl font-bold text-amber-400">{score}</span>
                    <p className="text-sm text-white/40">{t("points")}</p>
                  </div>
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
    if (!answerResult) return "bg-white/8 border-white/15 text-white";
    if (key === answerResult.correctAnswer) return "bg-emerald-500/25 border-emerald-400 text-emerald-200";
    if (key === answerResult.answerGiven && !answerResult.isCorrect) return "bg-red-500/25 border-red-400 text-red-200";
    return "bg-white/3 border-white/8 text-white/30";
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a1628 0%, #122a4f 50%, #1a3a6e 100%)" }}>
      <div className="w-full relative">
        <img
          src="/images/ramadan-banner.jpeg"
          alt="Ramadan Competition Banner"
          className="w-full h-auto"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#122a4f]" />
      </div>

      <div className="absolute top-3 right-3 z-20">
        {connected ? (
          <Badge variant="secondary" className="gap-1 text-emerald-400 bg-black/40 border-emerald-500/30">
            <Wifi className="h-3 w-3" /> {t("connected") || "Live"}
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1 bg-red-900/60">
            <WifiOff className="h-3 w-3" /> {t("disconnected") || "Offline"}
          </Badge>
        )}
      </div>

      <div className="relative z-10 flex flex-col px-4 md:px-6 pb-4" style={{ minHeight: "80vh" }}>
        {currentTeam && (
          <motion.div
            key={currentTeam.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4 mb-4 py-3"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-lg ring-2 ring-white/20"
                style={{ backgroundColor: currentTeam.color }}
              >
                <Users className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-sm text-amber-200/60 uppercase tracking-widest font-medium">{t("currentTeam")}</span>
                </div>
                <h2 className={`text-2xl md:text-3xl font-bold text-white ${isRTL ? "font-arabic" : ""}`} data-testid="display-current-team">
                  {language === "ar" ? currentTeam.nameAr : currentTeam.nameEn}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-sm text-white/40">{t("questions")}</span>
                <p className="text-lg font-bold text-amber-300">{answeredQuestionIds.length}/{questions.length}</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex-1 flex gap-5 min-h-0">
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
                    <div className="flex items-center gap-3">
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 gap-1.5 text-base px-4 py-1.5">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        {t("questionNumber")}{questionNumber}
                      </Badge>
                      <Badge className="bg-white/10 text-white/80 border-white/15 text-base px-3 py-1.5">
                        {category}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative w-28 h-28 shrink-0">
                        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 160 160">
                          <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                          <motion.circle
                            cx="80" cy="80" r="70"
                            stroke={getTimerStroke()}
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 0.5, ease: "linear" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.span
                            key={timer.seconds}
                            initial={timer.seconds <= 5 ? { scale: 1.3 } : { scale: 1 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className={`text-4xl font-bold tabular-nums ${getTimerColor()} ${timer.seconds <= 5 && timer.running ? "animate-pulse" : ""}`}
                            data-testid="display-timer"
                          >
                            {timer.seconds}
                          </motion.span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-7 md:p-9 rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 shadow-xl">
                    <div className="flex items-start gap-5">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 shrink-0 mt-1">
                        <HelpCircle className="h-6 w-6 text-amber-400" />
                      </div>
                      <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-relaxed ${isRTL ? "font-arabic text-right" : ""}`} data-testid="display-question-text">
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
                        className={`flex items-center gap-4 p-5 md:p-6 rounded-xl border-2 transition-all duration-300 ${getOptionDisplayStyle(option.key)}`}
                        data-testid={`display-option-${option.key}`}
                      >
                        <span className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold shrink-0 ${
                          answerResult && option.key === answerResult.correctAnswer
                            ? "bg-emerald-500 text-white"
                            : answerResult && option.key === answerResult.answerGiven && !answerResult.isCorrect
                              ? "bg-red-500 text-white"
                              : "bg-white/10 text-white"
                        }`}>
                          {option.key.toUpperCase()}
                        </span>
                        <span className={`flex-1 text-lg md:text-xl font-medium ${isRTL ? "font-arabic" : ""}`}>
                          {option.text}
                        </span>
                        {answerResult && option.key === answerResult.correctAnswer && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          >
                            <CheckCircle2 className="h-10 w-10 text-emerald-400 shrink-0" />
                          </motion.div>
                        )}
                        {answerResult && option.key === answerResult.answerGiven && !answerResult.isCorrect && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <XCircle className="h-10 w-10 text-red-400 shrink-0" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <AnimatePresence>
                    {answerResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -30 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className={`flex items-center justify-center gap-6 p-8 rounded-2xl text-center font-bold ${
                          answerResult.isCorrect
                            ? "bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400/40"
                            : "bg-red-500/20 text-red-300 border-2 border-red-400/40"
                        }`}
                        data-testid="display-result"
                      >
                        {answerResult.isCorrect ? (
                          <>
                            <motion.div
                              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.3, 1] }}
                              transition={{ duration: 0.6, repeat: 2 }}
                            >
                              <CheckCircle2 className="h-16 w-16" />
                            </motion.div>
                            <span className={`text-5xl ${isRTL ? "font-arabic" : ""}`}>{t("correct")}</span>
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: [0, 1.5, 1] }}
                              transition={{ delay: 0.3, duration: 0.5 }}
                              className="text-6xl"
                            >
                              +1
                            </motion.span>
                          </>
                        ) : (
                          <>
                            <motion.div
                              animate={{ x: [-5, 5, -5, 5, 0] }}
                              transition={{ duration: 0.5, repeat: 1 }}
                            >
                              <XCircle className="h-16 w-16" />
                            </motion.div>
                            <span className={`text-5xl ${isRTL ? "font-arabic" : ""}`}>{t("incorrect")}</span>
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
                  {teamCompleted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-5 p-10 rounded-3xl bg-blue-500/15 border-2 border-blue-400/25 backdrop-blur-sm"
                      data-testid="display-team-completed"
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: 3 }}
                      >
                        <CheckCircle2 className="h-20 w-20 text-blue-400" />
                      </motion.div>
                      <p className={`text-3xl md:text-4xl text-white font-bold text-center ${isRTL ? "font-arabic" : ""}`}>
                        {teams.find(t => t.id === teamCompleted.completedTeamId)
                          ? language === "ar"
                            ? teams.find(t => t.id === teamCompleted.completedTeamId)!.nameAr
                            : teams.find(t => t.id === teamCompleted.completedTeamId)!.nameEn
                          : ""}{" "}
                        {t("teamCompletedMoving")}
                      </p>
                      <div className="flex items-center gap-3 px-8 py-4 rounded-full bg-white/10">
                        <div className="w-6 h-6 rounded-full" style={{
                          backgroundColor: teams.find(t => t.id === teamCompleted.nextTeamId)?.color
                        }} />
                        <span className={`text-2xl md:text-3xl text-white font-bold ${isRTL ? "font-arabic" : ""}`}>
                          {teams.find(t => t.id === teamCompleted.nextTeamId)
                            ? language === "ar"
                              ? teams.find(t => t.id === teamCompleted.nextTeamId)!.nameAr
                              : teams.find(t => t.id === teamCompleted.nextTeamId)!.nameEn
                            : ""}
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="h-20 w-20 text-amber-400/40" />
                      </motion.div>
                      <p className={`text-3xl text-white/50 font-medium ${isRTL ? "font-arabic" : ""}`} data-testid="display-waiting-selection">
                        {t("waitingForAdmin") || "Waiting for the next question..."}
                      </p>
                    </>
                  )}
                  {currentTeam && !teamCompleted && (
                    <div className="flex items-center gap-4 px-8 py-4 rounded-full bg-white/8 border border-white/10">
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: currentTeam.color }} />
                      <span className={`text-xl text-white font-medium ${isRTL ? "font-arabic" : ""}`}>
                        {language === "ar" ? currentTeam.nameAr : currentTeam.nameEn}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-72 lg:w-80 shrink-0 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-6 w-6 text-amber-400" />
              <h3 className={`text-sm font-semibold text-amber-200/60 uppercase tracking-widest ${isRTL ? "font-arabic" : ""}`}>
                {t("leaderboard")}
              </h3>
            </div>

            <div className="space-y-2.5 flex-1 overflow-auto">
              {sortedTeams.map((team, index) => {
                const teamScore = scores.find((s) => s.teamId === team.id);
                const isCurrent = session?.currentTeamId === team.id;
                const score = teamScore?.score || 0;
                const barWidth = maxScore > 0 ? (score / maxScore) * 100 : 0;

                return (
                  <motion.div
                    key={team.id}
                    layout
                    className={`p-4 rounded-xl transition-all backdrop-blur-sm ${
                      isCurrent ? "bg-white/12 ring-2 ring-amber-400/50 shadow-lg" : "bg-white/5 border border-white/8"
                    }`}
                    data-testid={`display-team-score-${team.id}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-7 shrink-0 flex justify-center">
                        {getRankIcon(index) || (
                          <span className="text-sm font-bold text-white/40">{index + 1}</span>
                        )}
                      </div>
                      <div className="w-4 h-4 rounded-full shrink-0 ring-2 ring-white/20" style={{ backgroundColor: team.color }} />
                      <span className={`text-base font-semibold text-white truncate flex-1 ${isRTL ? "font-arabic" : ""}`}>
                        {language === "ar" ? team.nameAr : team.nameEn}
                      </span>
                      <motion.span
                        key={score}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="text-xl font-bold text-amber-400 tabular-nums"
                      >
                        {score}
                      </motion.span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden ms-10">
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
