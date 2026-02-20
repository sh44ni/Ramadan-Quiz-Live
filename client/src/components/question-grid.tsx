import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { Check, Sparkles } from "lucide-react";

interface QuestionGridProps {
  questionIds: number[];
  answeredQuestions: number[];
  currentQuestion: number | null;
  onSelectQuestion: (questionId: number) => void;
  disabled: boolean;
}

export function QuestionGrid({
  questionIds,
  answeredQuestions,
  currentQuestion,
  onSelectQuestion,
  disabled,
}: QuestionGridProps) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const progress = answeredQuestions.length;
  const total = questionIds.length;
  const progressPercent = total > 0 ? (progress / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3
          className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}
          data-testid="text-select-question"
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          {t("selectQuestion")}
        </h3>
        <span className="text-xs text-muted-foreground font-medium tabular-nums">
          {progress}/{total}
        </span>
      </div>

      <div className="relative h-2 w-full rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          className="h-full rounded-full gold-gradient"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="grid grid-cols-6 gap-2">
        {questionIds.map((qId, idx) => {
          const num = idx + 1;
          const isAnswered = answeredQuestions.includes(qId);
          const isCurrent = currentQuestion === qId;

          return (
            <motion.button
              key={num}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.02 }}
              whileTap={!isAnswered && !disabled ? { scale: 0.9 } : {}}
              onClick={() => !isAnswered && !disabled && onSelectQuestion(qId)}
              disabled={isAnswered || disabled}
              className={`
                relative flex items-center justify-center rounded-md
                h-12 md:h-14 text-sm md:text-base font-bold
                transition-all duration-200
                ${
                  isCurrent
                    ? "game-tile current animate-pulse-glow"
                    : isAnswered
                      ? "game-tile answered text-muted-foreground/40 cursor-not-allowed"
                      : "game-tile cursor-pointer"
                }
              `}
              data-testid={`button-question-${num}`}
            >
              {isAnswered ? (
                <Check className="h-4 w-4 text-muted-foreground/40" />
              ) : (
                <span className={isCurrent ? "text-white" : "text-primary"}>{num}</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
