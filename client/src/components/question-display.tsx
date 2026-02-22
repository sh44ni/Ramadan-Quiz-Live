import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, HelpCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Question } from "@shared/schema";

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  onAnswer: (answer: string) => void;
  showResult: "correct" | "incorrect" | null;
  correctAnswer: string | null;
  disabled: boolean;
  selectedAnswer: string | null;
}

export function QuestionDisplay({
  question,
  questionNumber,
  onAnswer,
  showResult,
  correctAnswer,
  disabled,
  selectedAnswer,
}: QuestionDisplayProps) {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();

  const questionText = language === "ar" ? question.textAr : question.textEn;
  const options = [
    { key: "a", text: language === "ar" ? question.optionAAr : question.optionAEn },
    { key: "b", text: language === "ar" ? question.optionBAr : question.optionBEn },
    { key: "c", text: language === "ar" ? question.optionCAr : question.optionCEn },
    { key: "d", text: language === "ar" ? question.optionDAr : question.optionDEn },
  ];
  const category = language === "ar" ? question.categoryAr : question.categoryEn;

  const getOptionStyle = (key: string) => {
    if (!showResult) {
      if (selectedAnswer === key) {
        return "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20";
      }
      return "bg-card border-border hover-elevate active-elevate-2 cursor-pointer";
    }

    if (key === correctAnswer) {
      return "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md shadow-emerald-500/10";
    }
    if (key === selectedAnswer && showResult === "incorrect") {
      return "bg-red-500/15 border-red-500 text-red-700 dark:text-red-300";
    }
    return "bg-muted/50 border-border text-muted-foreground opacity-50";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <Badge variant="outline" className="shrink-0 gap-1">
          <Sparkles className="h-3 w-3 text-amber-500" />
          {t("questionNumber")}{questionNumber}
        </Badge>
        <Badge variant="secondary" className="shrink-0">
          {category}
        </Badge>
      </div>

      <Card className="p-4 md:p-6 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0 mt-0.5">
            <HelpCircle className="h-4 w-4 text-primary" />
          </div>
          <h2
            className={`text-base md:text-lg font-semibold leading-relaxed ${isRTL ? "font-arabic text-right" : ""}`}
            data-testid="text-question"
          >
            {questionText}
          </h2>
        </div>
      </Card>

      <div className="grid gap-2.5">
        {options.map((option, idx) => (
          <motion.button
            key={option.key}
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            whileTap={!disabled && !showResult ? { scale: 0.98 } : {}}
            onClick={() => !disabled && !showResult && onAnswer(option.key)}
            disabled={disabled || !!showResult}
            className={`
              relative flex items-center gap-3 p-3 md:p-4 rounded-md border-2
              text-start transition-all duration-200
              ${getOptionStyle(option.key)}
            `}
            data-testid={`button-option-${option.key}`}
          >
            <span
              className={`
                flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 transition-all
                ${
                  selectedAnswer === option.key && !showResult
                    ? "bg-white/20 text-white"
                    : showResult && option.key === correctAnswer
                      ? "bg-emerald-500 text-white"
                      : showResult && option.key === selectedAnswer
                        ? "bg-red-500 text-white"
                        : "bg-primary/10 text-primary"
                }
              `}
            >
              {option.key.toUpperCase()}
            </span>
            <span className={`flex-1 text-sm md:text-base font-medium ${isRTL ? "font-arabic" : ""}`}>
              {option.text}
            </span>
            {showResult && option.key === correctAnswer && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              </motion.div>
            )}
            {showResult && option.key === selectedAnswer && showResult === "incorrect" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`
              flex items-center justify-center gap-3 p-5 rounded-md text-center font-bold text-lg
              ${
                showResult === "correct"
                  ? "correct-flash text-emerald-600 dark:text-emerald-400"
                  : "incorrect-flash bg-red-500/15 text-red-600 dark:text-red-400"
              }
            `}
            data-testid="text-result"
          >
            {showResult === "correct" ? (
              <>
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  <CheckCircle2 className="h-8 w-8" />
                </motion.div>
                <span className={isRTL ? "font-arabic" : ""}>{t("correct")}</span>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: [0, 1.5, 1] }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-2xl"
                >
                  +1
                </motion.div>
              </>
            ) : (
              <>
                <XCircle className="h-8 w-8" />
                <span className={isRTL ? "font-arabic" : ""}>{t("incorrect")}</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
