import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Moon, Star, Users, Clock, Trophy, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Welcome() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [, setLocation] = useLocation();

  const rules = [
    { icon: Users, text: t("rule1") },
    { icon: BookOpen, text: t("rule2") },
    { icon: Clock, text: t("rule3") },
    { icon: Star, text: t("rule4") },
    { icon: Trophy, text: t("rule5") },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center p-4 md:p-8 islamic-pattern">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full space-y-6 text-center"
      >
        <div className="space-y-3">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="flex justify-center"
          >
            <div className="relative">
              <Moon className="h-16 w-16 text-amber-500 fill-amber-500" />
              <Star className="h-5 w-5 text-amber-400 fill-amber-400 absolute -top-1 -right-2" />
              <Star className="h-3 w-3 text-amber-300 fill-amber-300 absolute top-0 -left-3" />
            </div>
          </motion.div>

          <h1
            className={`text-3xl md:text-4xl font-bold text-foreground ${isRTL ? "font-arabic" : ""}`}
            data-testid="text-welcome-title"
          >
            {t("welcome")}
          </h1>
          <p
            className={`text-muted-foreground text-sm md:text-base max-w-md mx-auto ${isRTL ? "font-arabic" : ""}`}
            data-testid="text-welcome-desc"
          >
            {t("gameWelcomeDesc")}
          </p>
        </div>

        <Card className="p-5 text-start">
          <h3
            className={`text-base font-semibold mb-3 flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}
          >
            <BookOpen className="h-4 w-4 text-primary" />
            {t("rulesTitle")}
          </h3>
          <div className="space-y-2.5">
            {rules.map((rule, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: isRTL ? 15 : -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 shrink-0">
                  <rule.icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className={`text-sm ${isRTL ? "font-arabic" : ""}`}>{rule.text}</span>
              </motion.div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={() => setLocation("/login")}
            className="w-full"
            data-testid="button-player-login"
          >
            <Trophy className="h-4 w-4" />
            <span className={isRTL ? "font-arabic" : ""}>{t("playerLogin")}</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setLocation("/admin")}
            className="w-full"
            data-testid="button-enter-admin"
          >
            <span className={isRTL ? "font-arabic" : ""}>{t("enterAdmin")}</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
