import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Crown, Star, Medal, ArrowLeft, Sparkles } from "lucide-react";
import type { Team, GameSession, TeamScore } from "@shared/schema";

function ConfettiStars() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 60}%` }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, 30, 60],
            rotate: [0, 180, 360],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        >
          <Star
            className="fill-amber-400 text-amber-400"
            style={{ width: 6 + Math.random() * 10, height: 6 + Math.random() * 10 }}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default function Results() {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: teamsData } = useQuery<Team[]>({ queryKey: ["/api/teams"] });

  const { data: sessionData, isLoading } = useQuery<{
    session: GameSession;
    scores: TeamScore[];
    answeredQuestionIds: number[];
  } | null>({
    queryKey: ["/api/game/current"],
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  const teams = teamsData || [];
  const scores = sessionData?.scores || [];

  const sortedResults = [...teams]
    .map((team) => {
      const score = scores.find((s) => s.teamId === team.id);
      return {
        team,
        score: score?.score || 0,
        questionsAnswered: score?.questionsAnswered || 0,
        correctAnswers: score?.correctAnswers || 0,
      };
    })
    .sort((a, b) => b.score - a.score);

  const winner = sortedResults[0];
  const maxScore = Math.max(...sortedResults.map((r) => r.score), 1);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-8 w-8 text-amber-400 fill-amber-400 drop-shadow-lg" />;
    if (index === 1) return <Medal className="h-7 w-7 text-gray-400" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">{index + 1}</span>;
  };

  return (
    <div className="min-h-[calc(100vh-52px)] flex flex-col">
      <div className="relative ramadan-gradient py-10 md:py-14 px-4 overflow-hidden">
        <ConfettiStars />
        <div className="mosque-silhouette opacity-15" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center space-y-4 max-w-2xl mx-auto"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl scale-150" />
              <Trophy className="h-20 w-20 text-amber-400 relative z-10 drop-shadow-lg" />
            </div>
          </motion.div>
          <h1
            className={`text-3xl md:text-4xl font-bold text-white drop-shadow-lg ${isRTL ? "font-arabic" : ""}`}
            data-testid="text-game-over"
          >
            {t("gameOver")}
          </h1>
          {winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <p className={`text-blue-100/70 ${isRTL ? "font-arabic" : ""}`}>
                {t("congratulations")}
              </p>
              <div
                className="inline-block px-6 py-2 rounded-full text-xl md:text-2xl font-bold text-white"
                style={{
                  backgroundColor: winner.team.color,
                  boxShadow: `0 0 30px ${winner.team.color}60`,
                }}
                data-testid="text-winner"
              >
                {language === "ar" ? winner.team.nameAr : winner.team.nameEn}
              </div>
              <div className="text-amber-300 text-3xl font-bold">
                {winner.score} {t("points")}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="flex-1 p-4 md:p-6 islamic-pattern">
        <div className="max-w-2xl mx-auto space-y-3">
          {sortedResults.map((result, index) => {
            const barWidth = maxScore > 0 ? (result.score / maxScore) * 100 : 0;

            return (
              <motion.div
                key={result.team.id}
                initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card
                  className={`p-0 overflow-visible transition-all relative ${index === 0 ? "ring-2 ring-amber-400 animate-pulse-glow" : ""}`}
                  data-testid={`card-result-${result.team.id}`}
                >
                  {index < 3 && (
                    <div
                      className="absolute top-0 left-0 right-0 h-1 rounded-t-md"
                      style={{ backgroundColor: result.team.color }}
                    />
                  )}
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex items-center justify-center w-12 shrink-0">
                      {getRankIcon(index)}
                    </div>
                    <div
                      className="w-5 h-5 rounded-full shrink-0"
                      style={{ backgroundColor: result.team.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold truncate ${isRTL ? "font-arabic" : ""}`}>
                        {language === "ar" ? result.team.nameAr : result.team.nameEn}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                        <span className="font-arabic">{result.team.captain}</span>
                      </div>

                      <div className="relative h-2 w-full rounded-full bg-muted/50 overflow-hidden mt-2">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: result.team.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + index * 0.1, ease: "easeOut" }}
                        />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                        <span>{t("correctAnswers")}: {result.correctAnswers}/{result.questionsAnswered}</span>
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <motion.span
                        className="text-2xl font-bold"
                        style={{ color: result.team.color }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.1, type: "spring" }}
                      >
                        {result.score}
                      </motion.span>
                      <p className="text-[10px] text-muted-foreground">{t("points")}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex justify-center pt-4"
          >
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              data-testid="button-back-results"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className={isRTL ? "font-arabic" : ""}>{t("backToHome")}</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
