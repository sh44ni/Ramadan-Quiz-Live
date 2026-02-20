import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

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

  const getBarColor = useCallback(() => {
    if (timeLeft > 20) return "bg-emerald-500";
    if (timeLeft > 10) return "bg-amber-500";
    return "bg-red-500";
  }, [timeLeft]);

  const getTextColor = useCallback(() => {
    if (timeLeft > 20) return "text-emerald-500";
    if (timeLeft > 10) return "text-amber-500";
    return "text-red-500";
  }, [timeLeft]);

  const getBgGlow = useCallback(() => {
    if (timeLeft > 20) return "";
    if (timeLeft > 10) return "shadow-[0_0_15px_rgba(245,158,11,0.15)]";
    return "shadow-[0_0_20px_rgba(239,68,68,0.2)]";
  }, [timeLeft]);

  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getStrokeColor = useCallback(() => {
    if (timeLeft > 20) return "#10b981";
    if (timeLeft > 10) return "#f59e0b";
    return "#ef4444";
  }, [timeLeft]);

  return (
    <div className={`flex items-center gap-4 p-2 rounded-md transition-shadow duration-500 ${getBgGlow()}`}>
      <div className="relative w-20 h-20 shrink-0">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40" cy="40" r="38"
            stroke="hsl(var(--muted))"
            strokeWidth="4"
            fill="none"
          />
          <motion.circle
            cx="40" cy="40" r="38"
            stroke={getStrokeColor()}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "linear" }}
            className="timer-ring"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={timeLeft}
              initial={{ y: -8, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 8, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className={`text-2xl font-bold tabular-nums ${getTextColor()} ${timeLeft <= 5 ? "animate-pulse" : ""}`}
              data-testid="text-timer"
            >
              {timeLeft}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Clock className={`h-4 w-4 ${getTextColor()}`} />
            <span className="text-sm font-medium text-muted-foreground">{t("timer")}</span>
          </div>
          <span className={`text-xs font-medium ${getTextColor()}`}>
            {timeLeft > 20 ? t("plentyOfTime") : timeLeft > 10 ? t("hurryUp") : t("almostOut")}
          </span>
        </div>
        <div className="relative h-3 w-full rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${getBarColor()} transition-colors duration-500`}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}
