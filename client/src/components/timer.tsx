import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";

interface TimerProps {
  duration: number;
  isRunning: boolean;
  onTimeUp: () => void;
  onTick?: (remaining: number) => void;
}

export function Timer({ duration, isRunning, onTimeUp, onTick }: TimerProps) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (onTick) onTick(next);
        if (next <= 0) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeUp, onTick]);

  const percentage = (timeLeft / duration) * 100;
  const getColor = useCallback(() => {
    if (timeLeft > 20) return "text-emerald-500";
    if (timeLeft > 10) return "text-amber-500";
    return "text-red-500";
  }, [timeLeft]);

  const getProgressColor = useCallback(() => {
    if (timeLeft > 20) return "bg-emerald-500";
    if (timeLeft > 10) return "bg-amber-500";
    return "bg-red-500";
  }, [timeLeft]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className={`h-5 w-5 ${getColor()}`} />
          <span className="text-sm font-medium text-muted-foreground">{t("timer")}</span>
        </div>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={timeLeft}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`text-2xl font-bold tabular-nums ${getColor()} ${timeLeft <= 5 ? "animate-pulse" : ""}`}
            data-testid="text-timer"
          >
            {timeLeft}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getProgressColor()} transition-colors duration-500`}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: "linear" }}
        />
      </div>
    </div>
  );
}
