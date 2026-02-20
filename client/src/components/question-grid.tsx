import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";

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

  return (
    <div className="space-y-3">
      <h3
        className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider ${isRTL ? "font-arabic" : ""}`}
        data-testid="text-select-question"
      >
        {t("selectQuestion")}
      </h3>
      <div className="grid grid-cols-5 md:grid-cols-6 gap-2">
        {questionIds.map((qId, idx) => {
          const num = idx + 1;
          const isAnswered = answeredQuestions.includes(qId);
          const isCurrent = currentQuestion === qId;

          return (
            <motion.button
              key={num}
              whileTap={!isAnswered && !disabled ? { scale: 0.95 } : {}}
              onClick={() => !isAnswered && !disabled && onSelectQuestion(qId)}
              disabled={isAnswered || disabled}
              className={`
                relative flex items-center justify-center rounded-md
                h-12 md:h-14 text-sm md:text-base font-bold
                transition-all duration-200
                ${
                  isCurrent
                    ? "bg-amber-500 text-white ring-2 ring-amber-300 animate-pulse-glow"
                    : isAnswered
                      ? "bg-muted/60 text-muted-foreground/40 cursor-not-allowed line-through"
                      : "bg-primary/10 text-primary hover-elevate active-elevate-2 cursor-pointer border border-primary/20"
                }
              `}
              data-testid={`button-question-${num}`}
            >
              {num}
              {isAnswered && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-0.5 bg-muted-foreground/30 rotate-45 absolute" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
