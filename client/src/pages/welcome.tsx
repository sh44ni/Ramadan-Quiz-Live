import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Moon, Star, Users, Clock, Trophy, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function FloatingStars() {
  const stars = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 8 + 4,
    delay: Math.random() * 3,
    duration: Math.random() * 2 + 2,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          style={{ left: `${star.x}%`, top: `${star.y}%` }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
        >
          <Star
            className="text-amber-400/40 fill-amber-400/40"
            style={{ width: star.size, height: star.size }}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default function Welcome() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [, setLocation] = useLocation();

  const rules = [
    { icon: Users, text: t("rule1"), color: "from-blue-500/20 to-blue-600/10" },
    { icon: BookOpen, text: t("rule2"), color: "from-amber-500/20 to-amber-600/10" },
    { icon: Clock, text: t("rule3"), color: "from-emerald-500/20 to-emerald-600/10" },
    { icon: Star, text: t("rule4"), color: "from-purple-500/20 to-purple-600/10" },
    { icon: Trophy, text: t("rule5"), color: "from-rose-500/20 to-rose-600/10" },
  ];

  return (
    <div className="min-h-[calc(100vh-52px)] flex flex-col">
      <div className="relative ramadan-gradient py-12 md:py-16 px-4">
        <FloatingStars />
        <div className="mosque-silhouette" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-lg mx-auto text-center space-y-5"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl scale-150" />
              <Moon className="h-20 w-20 text-amber-400 fill-amber-400 relative z-10 drop-shadow-lg" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4"
              >
                <Star className="h-4 w-4 text-amber-300 fill-amber-300 absolute -top-1 right-0" />
                <Star className="h-3 w-3 text-amber-200 fill-amber-200 absolute bottom-0 -left-2" />
                <Star className="h-2.5 w-2.5 text-white fill-white absolute top-1/2 -right-3" />
              </motion.div>
            </div>
          </motion.div>

          <div className="space-y-2">
            <h1
              className={`text-3xl md:text-5xl font-bold text-white drop-shadow-lg ${isRTL ? "font-arabic" : ""}`}
              data-testid="text-welcome-title"
            >
              {t("welcome")}
            </h1>
            <p
              className={`text-blue-100/80 text-sm md:text-base max-w-md mx-auto ${isRTL ? "font-arabic" : ""}`}
              data-testid="text-welcome-desc"
            >
              {t("gameWelcomeDesc")}
            </p>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Button
              size="lg"
              onClick={() => setLocation("/login")}
              className="w-full gold-gradient border-amber-400/30 text-white font-bold shadow-lg shadow-amber-500/20 no-default-hover-elevate no-default-active-elevate hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              data-testid="button-player-login"
            >
              <Trophy className="h-5 w-5" />
              <span className={isRTL ? "font-arabic" : ""}>{t("playerLogin")}</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setLocation("/admin")}
              className="w-full bg-white/10 border-white/20 text-white"
              data-testid="button-enter-admin"
            >
              <span className={isRTL ? "font-arabic" : ""}>{t("enterAdmin")}</span>
            </Button>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 p-4 md:p-8 islamic-pattern">
        <div className="max-w-lg mx-auto">
          <Card className="p-5 md:p-6">
            <h3
              className={`text-base font-semibold mb-4 flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}
            >
              <Sparkles className="h-5 w-5 text-amber-500" />
              {t("rulesTitle")}
            </h3>
            <div className="space-y-2.5">
              {rules.map((rule, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className={`flex items-center gap-3 p-2.5 rounded-md bg-gradient-to-r ${rule.color}`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background/80 shrink-0">
                    <rule.icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className={`text-sm ${isRTL ? "font-arabic" : ""}`}>{rule.text}</span>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
