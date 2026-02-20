import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Crown, Star, Medal, ArrowLeft, Moon } from "lucide-react";
import type { Team, GameSession, TeamScore } from "@shared/schema";

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
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
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

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-8 w-8 text-amber-400 fill-amber-400" />;
    if (index === 1) return <Medal className="h-7 w-7 text-gray-400" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">{index + 1}</span>;
  };

  return (
    <div className="min-h-[calc(100vh-56px)] p-4 md:p-6 islamic-pattern">
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex justify-center"
          >
            <Trophy className="h-16 w-16 text-amber-500" />
          </motion.div>
          <h1
            className={`text-3xl font-bold ${isRTL ? "font-arabic" : ""}`}
            data-testid="text-game-over"
          >
            {t("gameOver")}
          </h1>
          {winner && (
            <div className="space-y-1">
              <p className={`text-muted-foreground ${isRTL ? "font-arabic" : ""}`}>
                {t("congratulations")}
              </p>
              <p
                className={`text-xl font-bold ${isRTL ? "font-arabic" : ""}`}
                style={{ color: winner.team.color }}
                data-testid="text-winner"
              >
                {language === "ar" ? winner.team.nameAr : winner.team.nameEn}
              </p>
            </div>
          )}
        </motion.div>

        <div className="space-y-3">
          {sortedResults.map((result, index) => (
            <motion.div
              key={result.team.id}
              initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`p-4 ${index === 0 ? "ring-2 ring-amber-400" : ""}`}
                data-testid={`card-result-${result.team.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 shrink-0">
                    {getRankIcon(index)}
                  </div>
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: result.team.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold truncate ${isRTL ? "font-arabic" : ""}`}>
                      {language === "ar" ? result.team.nameAr : result.team.nameEn}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>
                        {t("questionsAnswered")}: {result.questionsAnswered}
                      </span>
                      <span>
                        {t("correctAnswers")}: {result.correctAnswers}
                      </span>
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <span
                      className="text-2xl font-bold"
                      style={{ color: result.team.color }}
                    >
                      {result.score}
                    </span>
                    <p className="text-[10px] text-muted-foreground">{t("points")}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            data-testid="button-back-results"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className={isRTL ? "font-arabic" : ""}>{t("backToHome")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
