import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { Badge } from "@/components/ui/badge";
import type { Team, TeamScore } from "@shared/schema";

interface ScoreboardProps {
  teams: Team[];
  scores: TeamScore[];
  currentTeamId: number | null;
  compact?: boolean;
}

export function Scoreboard({ teams, scores, currentTeamId, compact = false }: ScoreboardProps) {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();

  const sortedTeams = [...teams].sort((a, b) => {
    const scoreA = scores.find((s) => s.teamId === a.id)?.score || 0;
    const scoreB = scores.find((s) => s.teamId === b.id)?.score || 0;
    return scoreB - scoreA;
  });

  const maxScore = Math.max(...sortedTeams.map((t) => scores.find((s) => s.teamId === t.id)?.score || 0), 1);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-amber-400 fill-amber-400" />;
    if (index === 1) return <Star className="h-4 w-4 text-gray-400 fill-gray-400" />;
    if (index === 2) return <Star className="h-4 w-4 text-amber-600 fill-amber-600" />;
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h3
          className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider ${isRTL ? "font-arabic" : ""}`}
          data-testid="text-scoreboard-title"
        >
          {t("leaderboard")}
        </h3>
      </div>

      <AnimatePresence>
        {sortedTeams.map((team, index) => {
          const teamScore = scores.find((s) => s.teamId === team.id);
          const isCurrent = currentTeamId === team.id;
          const score = teamScore?.score || 0;
          const barWidth = maxScore > 0 ? (score / maxScore) * 100 : 0;

          return (
            <motion.div
              key={team.id}
              layout
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative p-3 rounded-md transition-all duration-300
                ${isCurrent
                  ? "ring-2 ring-amber-400 animate-pulse-glow bg-amber-500/5"
                  : "bg-muted/30"
                }
              `}
              data-testid={`card-team-score-${team.id}`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center justify-center w-6 shrink-0">
                    {getRankIcon(index) || (
                      <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>
                    )}
                  </div>
                  <div
                    className="w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-background"
                    style={{ backgroundColor: team.color }}
                  />
                  <span
                    className={`text-sm font-semibold truncate ${isRTL ? "font-arabic" : ""}`}
                  >
                    {language === "ar" ? team.nameAr : team.nameEn}
                  </span>
                  {isCurrent && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {t("currentTeam")}
                    </Badge>
                  )}
                </div>
                <motion.div
                  key={score}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 shrink-0"
                >
                  <span className="text-lg font-bold" style={{ color: team.color }}>
                    {score}
                  </span>
                  {!compact && (
                    <span className="text-[10px] text-muted-foreground">{t("points")}</span>
                  )}
                </motion.div>
              </div>

              <div className="relative h-1.5 w-full rounded-full bg-muted/50 overflow-hidden ms-8">
                <motion.div
                  className="h-full rounded-full score-bar"
                  style={{ backgroundColor: team.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>

              {!compact && (
                <div className="ms-8 mt-1.5">
                  <div className="text-[11px] text-muted-foreground font-arabic flex items-center gap-1">
                    <Crown className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                    {team.captain}
                  </div>
                  {teamScore && (
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                      <span>
                        {t("questionsAnswered")}: {teamScore.questionsAnswered}
                      </span>
                      <span>
                        {t("correctAnswers")}: {teamScore.correctAnswers}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
