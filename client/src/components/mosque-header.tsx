import { Moon, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

function MosqueSilhouette() {
  return (
    <svg
      viewBox="0 0 1200 200"
      className="w-full h-auto absolute bottom-0 left-0 right-0"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <linearGradient id="mosqueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <g fill="url(#mosqueGrad)">
        <rect x="50" y="120" width="20" height="80" rx="2" />
        <rect x="50" y="100" width="20" height="25" rx="10" />
        <path d="M200 140 Q230 80 260 140 Z" />
        <rect x="220" y="140" width="20" height="60" />
        <rect x="180" y="160" width="100" height="40" rx="3" />
        <rect x="1130" y="120" width="20" height="80" rx="2" />
        <rect x="1130" y="100" width="20" height="25" rx="10" />
        <path d="M940 140 Q970 80 1000 140 Z" />
        <rect x="960" y="140" width="20" height="60" />
        <rect x="920" y="160" width="100" height="40" rx="3" />
        <path d="M500 100 Q600 20 700 100 Z" />
        <rect x="540" y="100" width="120" height="100" rx="4" />
        <rect x="580" y="60" width="40" height="45" rx="20" />
        <path d="M560 130 Q600 110 640 130 Z" />
        <rect x="480" y="150" width="240" height="50" rx="4" />
      </g>
    </svg>
  );
}

export function MosqueHeader() {
  const { t } = useTranslation();
  const { language, toggleLanguage, isRTL } = useLanguage();

  return (
    <header className="relative bg-gradient-to-b from-primary via-primary/95 to-primary/90 text-white overflow-hidden">
      <div className="absolute inset-0 islamic-pattern opacity-20" />
      <MosqueSilhouette />

      <div className="relative z-10 flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Moon className="h-7 w-7 text-amber-300 fill-amber-300" />
          </motion.div>
          <div>
            <h1
              className={`text-lg md:text-xl font-bold tracking-tight ${isRTL ? "font-arabic" : ""}`}
              data-testid="text-app-title"
            >
              {t("appTitle")}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.div className="hidden md:flex items-center gap-1 text-amber-200/80">
            <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
            <Star className="h-2 w-2 fill-amber-200 text-amber-200" />
            <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
          </motion.div>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="bg-white/10 border-white/20 text-white backdrop-blur-sm"
            data-testid="button-language-toggle"
          >
            {language === "ar" ? "English" : "العربية"}
          </Button>
        </div>
      </div>
    </header>
  );
}
