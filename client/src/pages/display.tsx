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
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  User,
  Hash,
  Clock,
  Eye,
} from "lucide-react";

export default function Display() {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const { gameState, timer, answerResult, teamCompleted, connected } = useGameSocket();

  const { session, scores, teams, questions, currentQuestion, phase, currentTeamId, currentPlayerName, usedQuestionNumbers, entryTeams, totalQuestions, questionsPerTeam, teamQuestionsAnswered, gameError } = gameState;
  const currentTeam = teams.find((t) => t.id === currentTeamId);

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

  const getTimerMax = () => {
    switch (phase) {
      case "entry": return 120;
      case "selection": return 10;
      case "preparation": return 10;
      case "answer": return 30;
      default: return 30;
    }
  };

  const getTimerColor = () => {
    const max = getTimerMax();
    if (timer.seconds > max * 0.5) return "text-emerald-400";
    if (timer.seconds > max * 0.25) return "text-amber-400";
    return "text-red-400";
  };

  const getTimerStroke = () => {
    const max = getTimerMax();
    if (timer.seconds > max * 0.5) return "#10b981";
    if (timer.seconds > max * 0.25) return "#f59e0b";
    return "#ef4444";
  };

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - ((timer.seconds / getTimerMax()) * circumference);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-amber-400 fill-amber-400" />;
    if (index === 1) return <Star className="h-5 w-5 text-gray-300 fill-gray-300" />;
    if (index === 2) return <Star className="h-5 w-5 text-amber-600 fill-amber-600" />;
    return null;
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case "entry": return t("entryPhase");
      case "selection": return t("phaseSelection");
      case "preparation": return t("phasePreparation");
      case "answer": return t("phaseAnswer");
      case "paused": return t("paused");
      case "team-complete": return t("teamCompletePhase");
      case "finished": return t("gameOver");
      default: return "";
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case "entry": return "bg-purple-500/30 text-purple-300 border-purple-400/30";
      case "selection": return "bg-blue-500/30 text-blue-300 border-blue-400/30";
      case "preparation": return "bg-amber-500/30 text-amber-300 border-amber-400/30";
      case "answer": return "bg-emerald-500/30 text-emerald-300 border-emerald-400/30";
      case "paused": return "bg-orange-500/30 text-orange-300 border-orange-400/30";
      case "team-complete": return "bg-cyan-500/30 text-cyan-300 border-cyan-400/30";
      default: return "bg-white/10 text-white/60";
    }
  };

  const connectionBadge = (
    <div className="absolute top-3 left-3 z-20">
      {connected ? (
        <Badge variant="secondary" className="gap-1 text-emerald-400 bg-black/40 border-emerald-500/30">
          <Wifi className="h-3 w-3" /> {t("connected")}
        </Badge>
      ) : (
        <Badge variant="destructive" className="gap-1 bg-red-900/60">
          <WifiOff className="h-3 w-3" /> {t("disconnected")}
        </Badge>
      )}
    </div>
  );

  const bannerSide = (
    <div className="h-full shrink-0 relative" style={{ width: "28vw" }}>
      <img
        src="/images/ramadan-banner.jpeg"
        alt="Ramadan Competition Banner"
        className="w-full h-full object-cover object-center"
      />
    </div>
  );

  if (phase === "idle" || !session) {
    return (
      <div className="h-screen flex flex-row relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a1628 0%, #122a4f 50%, #1a3a6e 100%)" }}>
        {connectionBadge}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
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
              <p className="text-3xl md:text-4xl text-amber-200/80 font-arabic" data-testid="display-waiting-text">
                {t("waiting")}
              </p>
            </motion.div>
          </motion.div>
        </div>
        {bannerSide}
      </div>
    );
  }

  if (phase === "entry") {
    return (
      <div className="h-screen flex flex-row relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a1628 0%, #122a4f 50%, #1a3a6e 100%)" }}>
        {connectionBadge}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 max-w-2xl"
          >
            <Badge className={`text-lg px-4 py-2 ${getPhaseColor()}`}>
              <Clock className="h-4 w-4 mr-2" />
              {t("entryPhase")}
            </Badge>

            <div className="relative w-36 h-36 mx-auto">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                <motion.circle
                  cx="80" cy="80" r="70"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset: circumference - ((timer.seconds / 120) * circumference) }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold text-amber-400 tabular-nums" data-testid="display-entry-timer">
                  {timer.seconds}
                </span>
              </div>
            </div>

            <h1 className={`text-4xl font-bold text-white ${isRTL ? "font-arabic" : ""}`}>
              {t("entryPhaseDesc")}
            </h1>

            <div className="grid grid-cols-3 gap-4">
              {teams.map((team) => {
                const joined = entryTeams.includes(team.id);
                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-xl backdrop-blur-sm border-2 transition-all ${
                      joined
                        ? "bg-emerald-500/15 border-emerald-400/40"
                        : "bg-white/5 border-white/10"
                    }`}
                    data-testid={`display-entry-team-${team.id}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: team.color }} />
                      <span className={`text-sm font-bold text-white truncate ${isRTL ? "font-arabic" : ""}`}>
                        {language === "ar" ? team.nameAr : team.nameEn}
                      </span>
                    </div>
                    {joined ? (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {t("joined")}
                      </Badge>
                    ) : (
                      <Badge className="bg-white/10 text-white/40 border-white/10 text-xs">
                        {t("waiting")}
                      </Badge>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
        {bannerSide}
      </div>
    );
  }

  if (phase === "team-complete") {
    const completedTeam = teamCompleted ? teams.find((t) => t.id === teamCompleted.completedTeamId) : currentTeam;
    const nextTeam = teams.find((t) => t.id === currentTeamId);
    return (
      <div className="h-screen flex flex-row relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a1628 0%, #122a4f 50%, #1a3a6e 100%)" }}>
        {connectionBadge}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-8 gap-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex flex-col items-center gap-6 p-10 rounded-3xl bg-emerald-500/10 border-2 border-emerald-400/25 backdrop-blur-sm max-w-2xl w-full"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6, repeat: 3 }}
            >
              <CheckCircle2 className="h-20 w-20 text-emerald-400" />
            </motion.div>
            {completedTeam && (
              <div className="text-center">
                <p className={`text-lg text-emerald-300/70 uppercase tracking-widest font-medium mb-1 ${isRTL ? "font-arabic" : ""}`}>
                  {t("teamCompletePhase")}
                </p>
                <h1 className={`text-4xl md:text-5xl font-bold text-white ${isRTL ? "font-arabic" : ""}`} data-testid="display-completed-team">
                  {language === "ar" ? completedTeam.nameAr : completedTeam.nameEn}
                </h1>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-4"
          >
            {nextTeam && (
              <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className={`text-white/50 text-lg ${isRTL ? "font-arabic" : ""}`}>{t("upNext")}:</span>
                <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: nextTeam.color }} />
                <span className={`text-xl font-bold text-white ${isRTL ? "font-arabic" : ""}`} data-testid="display-next-team">
                  {language === "ar" ? nextTeam.nameAr : nextTeam.nameEn}
                </span>
              </div>
            )}
            <motion.p
              className={`text-white/40 text-base text-center ${isRTL ? "font-arabic" : ""}`}
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              data-testid="display-waiting-next-team"
            >
              {t("waitingForNextTeam")}
            </motion.p>
          </motion.div>
        </div>
        {bannerSide}
      </div>
    );
  }

  if (phase === "paused") {
    return (
      <div className="h-screen flex flex-row relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a1628 0%, #122a4f 50%, #1a3a6e 100%)" }}>
        {connectionBadge}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-8 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex flex-col items-center gap-6 p-12 rounded-3xl bg-orange-500/10 border-2 border-orange-400/25 backdrop-blur-sm"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center ring-4 ring-orange-400/30">
                <span className="text-5xl">⏸</span>
              </div>
            </motion.div>
            <h1 className={`text-5xl md:text-6xl font-bold text-orange-300 ${isRTL ? "font-arabic" : ""}`} data-testid="display-paused-title">
              {t("gamePausedTitle")}
            </h1>
            <motion.p
              className={`text-xl text-white/50 ${isRTL ? "font-arabic" : ""}`}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              data-testid="display-paused-subtitle"
            >
              {t("gamePausedSubtitle")}
            </motion.p>
          </motion.div>
        </div>
        {bannerSide}
      </div>
    );
  }

  if (phase === "finished" || session.status === "finished") {
    if (gameError === "not-enough-teams") {
      return (
        <div className="h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a1628 0%, #122a4f 50%, #1a3a6e 100%)" }}>
          {connectionBadge}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 text-center px-8 max-w-xl"
          >
            <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center ring-4 ring-red-400/30">
              <Users className="h-12 w-12 text-red-400" />
            </div>
            <h1 className={`text-4xl md:text-5xl font-bold text-white ${isRTL ? "font-arabic" : ""}`}>
              {t("notEnoughTeams")}
            </h1>
            <p className={`text-xl text-white/60 leading-relaxed ${isRTL ? "font-arabic" : ""}`}>
              {t("notEnoughTeamsDesc")}
            </p>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="h-screen flex flex-row relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a1628 0%, #122a4f 50%, #1a3a6e 100%)" }}>
        {connectionBadge}
        <div className="flex-1 flex flex-col relative z-10 overflow-hidden px-6 py-5">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2 shrink-0 mb-5">
            <div className="flex items-center justify-center gap-4">
              <Trophy className="h-14 w-14 text-amber-400 drop-shadow-lg" />
              <h1 className={`text-5xl md:text-6xl font-bold text-white ${isRTL ? "font-arabic" : ""}`}>
                {t("gameOver")}
              </h1>
            </div>
          </motion.div>
          <div className="flex-1 overflow-auto space-y-3 max-w-4xl mx-auto w-full">
            {sortedTeams.map((team, index) => {
              const teamScore = scores.find((s) => s.teamId === team.id);
              const score = teamScore?.score || 0;
              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className={`flex items-center gap-5 p-5 rounded-2xl backdrop-blur-sm ${
                    index === 0 ? "bg-amber-500/20 ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/10" : "bg-white/8 border border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-center w-12 shrink-0">
                    {getRankIcon(index) || (
                      <span className="text-2xl font-bold text-white/50">{index + 1}</span>
                    )}
                  </div>
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg"
                    style={{ backgroundColor: team.color }}
                  >
                    <Users className="h-5 w-5" />
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
        {bannerSide}
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

  const getOptionDisplayStyle = (key: string) => {
    if (!answerResult) return "bg-white/8 border-white/15 text-white";
    if (key === answerResult.correctAnswer) return "bg-emerald-500/25 border-emerald-400 text-emerald-200";
    if (key === answerResult.answerGiven && !answerResult.isCorrect) return "bg-red-500/25 border-red-400 text-red-200";
    return "bg-white/3 border-white/8 text-white/30";
  };

  return (
    <div className="h-screen flex flex-row relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a1628 0%, #122a4f 50%, #1a3a6e 100%)" }}>
      {connectionBadge}

      <div className="flex-1 flex flex-col px-5 py-3 overflow-hidden relative z-10">
        {currentTeam && (
          <div className="flex items-center justify-between gap-4 py-2 shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-lg ring-2 ring-white/20"
                style={{ backgroundColor: currentTeam.color }}
              >
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span className="text-xs text-amber-200/60 uppercase tracking-widest font-medium">{t("currentTeam")}</span>
                </div>
                <h2 className={`text-xl md:text-2xl font-bold text-white ${isRTL ? "font-arabic" : ""}`} data-testid="display-current-team">
                  {language === "ar" ? currentTeam.nameAr : currentTeam.nameEn}
                </h2>
              </div>
              {currentPlayerName && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15">
                  <User className="h-3.5 w-3.5 text-amber-300" />
                  <span className="text-sm font-medium text-white font-arabic">{currentPlayerName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Badge className={`text-sm px-3 py-1 ${getPhaseColor()}`}>
                {getPhaseLabel()}
              </Badge>
              {currentTeamId && (
                <div className="text-right">
                  <span className="text-xs text-white/40">Team Q</span>
                  <p className="text-base font-bold text-amber-300">{teamQuestionsAnswered[currentTeamId] || 0}/{questionsPerTeam}</p>
                </div>
              )}
              <div className="text-right">
                <span className="text-xs text-white/40">{t("questions")}</span>
                <p className="text-base font-bold text-amber-300">{usedQuestionNumbers.length}/{totalQuestions}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {phase === "selection" && (
                <motion.div
                  key="display-selection"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex-1 flex flex-col items-center justify-center gap-6"
                >
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
                      <span className={`text-4xl font-bold tabular-nums ${getTimerColor()}`} data-testid="display-timer">
                        {timer.seconds}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10">
                    <Hash className="h-10 w-10 text-blue-400" />
                    <p className={`text-2xl text-white font-bold ${isRTL ? "font-arabic" : ""}`}>
                      {t("phaseSelection")}
                    </p>
                    <p className={`text-lg text-white/60 ${isRTL ? "font-arabic" : ""}`}>
                      {currentPlayerName} {t("isSelectingQuestion")}
                    </p>
                  </div>
                </motion.div>
              )}

              {(phase === "preparation" || phase === "answer") && currentQuestion ? (
                <motion.div
                  key={`q-${currentQuestion.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <Badge className={`gap-1 text-sm px-3 py-1 ${getPhaseColor()}`}>
                        {phase === "preparation" ? <Eye className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                        {getPhaseLabel()}
                      </Badge>
                      {category && (
                        <Badge className="bg-white/10 text-white/80 border-white/15 text-sm px-2.5 py-1">
                          {category}
                        </Badge>
                      )}
                    </div>

                    <div className="relative w-20 h-20 shrink-0">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 160 160">
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
                          className={`text-3xl font-bold tabular-nums ${getTimerColor()} ${timer.seconds <= 5 && timer.running ? "animate-pulse" : ""}`}
                          data-testid="display-timer"
                        >
                          {timer.seconds}
                        </motion.span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 shadow-xl shrink-0">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 shrink-0 mt-0.5">
                        <HelpCircle className="h-5 w-5 text-amber-400" />
                      </div>
                      <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold text-white leading-relaxed ${isRTL ? "font-arabic text-right" : ""}`} data-testid="display-question-text">
                        {questionText}
                      </h2>
                    </div>
                  </div>

                  {phase === "answer" && (
                    <div className="grid grid-cols-2 gap-2.5 shrink-0">
                      {options.map((option, idx) => (
                        <motion.div
                          key={option.key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-300 ${getOptionDisplayStyle(option.key)}`}
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
                            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                              <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0" />
                            </motion.div>
                          )}
                          {answerResult && option.key === answerResult.answerGiven && !answerResult.isCorrect && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                              <XCircle className="h-8 w-8 text-red-400 shrink-0" />
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {phase === "preparation" && (
                    <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-400/20 shrink-0">
                      <Eye className="h-6 w-6 text-amber-400" />
                      <span className={`text-xl text-amber-200 font-medium ${isRTL ? "font-arabic" : ""}`}>
                        {t("readQuestion")}
                      </span>
                    </div>
                  )}

                  <AnimatePresence>
                    {answerResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -30 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className={`flex items-center justify-center gap-5 p-5 rounded-2xl text-center font-bold shrink-0 ${
                          answerResult.isCorrect
                            ? "bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400/40"
                            : "bg-red-500/20 text-red-300 border-2 border-red-400/40"
                        }`}
                        data-testid="display-result"
                      >
                        {answerResult.isCorrect ? (
                          <>
                            <motion.div animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: 2 }}>
                              <CheckCircle2 className="h-12 w-12" />
                            </motion.div>
                            <span className={`text-4xl ${isRTL ? "font-arabic" : ""}`}>{t("correct")}</span>
                            <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.5, 1] }} transition={{ delay: 0.3, duration: 0.5 }} className="text-5xl">+1</motion.span>
                          </>
                        ) : (
                          <>
                            <motion.div animate={{ x: [-5, 5, -5, 5, 0] }} transition={{ duration: 0.5, repeat: 1 }}>
                              <XCircle className="h-12 w-12" />
                            </motion.div>
                            <span className={`text-4xl ${isRTL ? "font-arabic" : ""}`}>{t("incorrect")}</span>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (phase !== "selection" && phase !== "entry") && (
                <motion.div
                  key="waiting-question"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center gap-5"
                >
                  {teamCompleted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-blue-500/15 border-2 border-blue-400/25 backdrop-blur-sm"
                      data-testid="display-team-completed"
                    >
                      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: 3 }}>
                        <CheckCircle2 className="h-16 w-16 text-blue-400" />
                      </motion.div>
                      <p className={`text-2xl md:text-3xl text-white font-bold text-center ${isRTL ? "font-arabic" : ""}`}>
                        {teams.find(t => t.id === teamCompleted.completedTeamId)
                          ? language === "ar"
                            ? teams.find(t => t.id === teamCompleted.completedTeamId)!.nameAr
                            : teams.find(t => t.id === teamCompleted.completedTeamId)!.nameEn
                          : ""}{" "}
                        {t("teamCompletedMoving")}
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                        <Sparkles className="h-16 w-16 text-amber-400/40" />
                      </motion.div>
                      <p className={`text-2xl text-white/50 font-medium ${isRTL ? "font-arabic" : ""}`} data-testid="display-waiting-selection">
                        {t("waitingForAdmin")}
                      </p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-56 lg:w-64 shrink-0 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h3 className={`text-xs font-semibold text-amber-200/60 uppercase tracking-widest ${isRTL ? "font-arabic" : ""}`}>
                {t("leaderboard")}
              </h3>
            </div>

            <div className="space-y-2 flex-1 overflow-auto">
              {sortedTeams.map((team, index) => {
                const teamScore = scores.find((s) => s.teamId === team.id);
                const isCurrent = currentTeamId === team.id;
                const score = teamScore?.score || 0;
                const barWidth = maxScore > 0 ? (score / maxScore) * 100 : 0;

                return (
                  <motion.div
                    key={team.id}
                    layout
                    className={`p-3 rounded-xl transition-all backdrop-blur-sm ${
                      isCurrent ? "bg-white/12 ring-2 ring-amber-400/50 shadow-lg" : "bg-white/5 border border-white/8"
                    }`}
                    data-testid={`display-team-score-${team.id}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 shrink-0 flex justify-center">
                        {getRankIcon(index) || (
                          <span className="text-sm font-bold text-white/40">{index + 1}</span>
                        )}
                      </div>
                      <div className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white/20" style={{ backgroundColor: team.color }} />
                      <span className={`text-sm font-semibold text-white truncate flex-1 ${isRTL ? "font-arabic" : ""}`}>
                        {language === "ar" ? team.nameAr : team.nameEn}
                      </span>
                      <motion.span
                        key={score}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="text-lg font-bold text-amber-400 tabular-nums"
                      >
                        {score}
                      </motion.span>
                    </div>
                    <div className="h-1 rounded-full bg-white/8 overflow-hidden ms-8">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: team.color }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {bannerSide}
    </div>
  );
}
