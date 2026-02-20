import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  Mail,
  KeyRound,
  LogIn,
  Grid3X3,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  BarChart3,
  Shield,
  UserPlus,
  Play,
  Pause,
  SkipForward,
  Square,
  RotateCcw,
  Plus,
  Minus,
  HelpCircle,
  Lock,
  Lightbulb,
  Monitor,
  Languages,
  Moon,
  Star,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";

type SectionKey = "players" | "admin" | "tips";

interface StepItem {
  icon: React.ElementType;
  text: string;
  highlight?: string;
}

function StepCard({
  step,
  index,
  isRTL,
  sectionId,
}: {
  step: StepItem;
  index: number;
  isRTL: boolean;
  sectionId: string;
}) {
  const Icon = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="flex items-start gap-3 p-3 rounded-md bg-muted/30"
      data-testid={`step-${sectionId}-${index}`}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground" data-testid={`text-step-number-${sectionId}-${index}`}>{index + 1}</span>
          {step.highlight && (
            <Badge variant="secondary" className="text-[10px]" data-testid={`badge-highlight-${sectionId}-${index}`}>{step.highlight}</Badge>
          )}
        </div>
        <p className={`text-sm mt-0.5 ${isRTL ? "font-arabic" : ""}`} data-testid={`text-step-${sectionId}-${index}`}>{step.text}</p>
      </div>
    </motion.div>
  );
}

function SectionBlock({
  title,
  titleIcon: TitleIcon,
  iconColor,
  steps,
  isRTL,
  delay = 0,
  sectionId,
}: {
  title: string;
  titleIcon: React.ElementType;
  iconColor: string;
  steps: StepItem[];
  isRTL: boolean;
  delay?: number;
  sectionId: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="p-4 space-y-3" data-testid={`card-section-${sectionId}`}>
        <h3 className={`text-sm font-semibold flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`} data-testid={`text-section-title-${sectionId}`}>
          <TitleIcon className={`h-4 w-4 ${iconColor}`} />
          {title}
        </h3>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} isRTL={isRTL} sectionId={sectionId} />
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

export default function Rules() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<SectionKey>("players");

  useEffect(() => {
    document.title = isRTL
      ? "كيف تلعب | مسابقة رمضان الثقافية"
      : "How to Play | Ramadan Quiz Competition";
    const metaDesc = document.querySelector('meta[name="description"]');
    const desc = isRTL
      ? "دليل شامل لمسابقة رمضان الثقافية - للاعبين والمشرفين"
      : "Complete guide to the Ramadan Quiz Competition - for players and admins";
    if (metaDesc) {
      metaDesc.setAttribute("content", desc);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = desc;
      document.head.appendChild(meta);
    }
  }, [isRTL]);

  const sections: { key: SectionKey; label: string; icon: React.ElementType; color: string }[] = [
    { key: "players", label: t("sectionPlayers"), icon: Users, color: "text-blue-500" },
    { key: "admin", label: t("sectionAdmin"), icon: Shield, color: "text-amber-500" },
    { key: "tips", label: t("sectionTips"), icon: Lightbulb, color: "text-emerald-500" },
  ];

  const playerSections = [
    {
      sectionId: "getting-started",
      title: t("gettingStartedTitle"),
      titleIcon: LogIn,
      iconColor: "text-blue-500",
      steps: [
        { icon: Users, text: t("gettingStartedStep1") },
        { icon: Mail, text: t("gettingStartedStep2") },
        { icon: KeyRound, text: t("gettingStartedStep3") },
        { icon: CheckCircle2, text: t("gettingStartedStep4") },
      ],
    },
    {
      sectionId: "gameplay",
      title: t("gameplayTitle"),
      titleIcon: Grid3X3,
      iconColor: "text-purple-500",
      steps: [
        { icon: Users, text: t("gameplayStep1") },
        { icon: HelpCircle, text: t("gameplayStep2") },
        { icon: Clock, text: t("gameplayStep3") },
        { icon: CheckCircle2, text: t("gameplayStep4") },
        { icon: SkipForward, text: t("gameplayStep5") },
      ],
    },
    {
      sectionId: "scoring",
      title: t("scoringTitle"),
      titleIcon: Trophy,
      iconColor: "text-amber-500",
      steps: [
        { icon: Plus, text: t("scoringStep1"), highlight: "+10" },
        { icon: XCircle, text: t("scoringStep2"), highlight: "0" },
        { icon: BarChart3, text: t("scoringStep3") },
        { icon: Trophy, text: t("scoringStep4") },
      ],
    },
    {
      sectionId: "timer",
      title: t("timerTitle"),
      titleIcon: Clock,
      iconColor: "text-emerald-500",
      steps: [
        { icon: CheckCircle2, text: t("timerStep1"), highlight: t("plentyOfTime") },
        { icon: Clock, text: t("timerStep2"), highlight: t("hurryUp") },
        { icon: XCircle, text: t("timerStep3"), highlight: t("almostOut") },
      ],
    },
    {
      sectionId: "question-grid",
      title: t("questionGridTitle"),
      titleIcon: Grid3X3,
      iconColor: "text-indigo-500",
      steps: [
        { icon: Grid3X3, text: t("questionGridStep1") },
        { icon: HelpCircle, text: t("questionGridStep2") },
        { icon: Lock, text: t("questionGridStep3") },
        { icon: Star, text: t("questionGridStep4") },
      ],
    },
  ];

  const adminSections = [
    {
      sectionId: "admin-setup",
      title: t("adminSetupTitle"),
      titleIcon: UserPlus,
      iconColor: "text-blue-500",
      steps: [
        { icon: Shield, text: t("adminSetupStep1") },
        { icon: Mail, text: t("adminSetupStep2") },
        { icon: Users, text: t("adminSetupStep3") },
        { icon: Mail, text: t("adminSetupStep4") },
      ],
    },
    {
      sectionId: "admin-controls",
      title: t("adminControlsTitle"),
      titleIcon: Play,
      iconColor: "text-emerald-500",
      steps: [
        { icon: Play, text: t("adminControlsStep1") },
        { icon: Users, text: t("adminControlsStep2") },
        { icon: Pause, text: t("adminControlsStep3") },
        { icon: SkipForward, text: t("adminControlsStep4") },
        { icon: Square, text: t("adminControlsStep5") },
        { icon: RotateCcw, text: t("adminControlsStep6") },
      ],
    },
    {
      sectionId: "admin-questions",
      title: t("adminQuestionsTitle"),
      titleIcon: HelpCircle,
      iconColor: "text-purple-500",
      steps: [
        { icon: Grid3X3, text: t("adminQuestionsStep1") },
        { icon: Clock, text: t("adminQuestionsStep2") },
        { icon: Lock, text: t("adminQuestionsStep3") },
      ],
    },
    {
      sectionId: "admin-score",
      title: t("adminScoreTitle"),
      titleIcon: BarChart3,
      iconColor: "text-amber-500",
      steps: [
        { icon: Plus, text: t("adminScoreStep1") },
        { icon: Minus, text: t("adminScoreStep2") },
        { icon: BarChart3, text: t("adminScoreStep3") },
      ],
    },
  ];

  const tipsSections = [
    {
      sectionId: "tips",
      title: t("tipsTitle"),
      titleIcon: Lightbulb,
      iconColor: "text-amber-500",
      steps: [
        { icon: Mail, text: t("tip1") },
        { icon: Shield, text: t("tip2") },
        { icon: Monitor, text: t("tip3") },
        { icon: Pause, text: t("tip4") },
        { icon: Users, text: t("tip5") },
        { icon: Languages, text: t("tip6") },
      ],
    },
  ];

  const currentSections =
    activeSection === "players"
      ? playerSections
      : activeSection === "admin"
        ? adminSections
        : tipsSections;

  return (
    <div className="min-h-[calc(100vh-52px)] flex flex-col">
      <div className="relative ramadan-gradient py-8 md:py-10 px-4 overflow-hidden">
        <div className="mosque-silhouette opacity-15" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: `${10 + i * 12}%`, top: `${15 + (i % 3) * 25}%` }}
              animate={{ opacity: [0.1, 0.5, 0.1], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
            >
              <Star className="h-2 w-2 text-amber-300 fill-amber-300" />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center space-y-3 max-w-lg mx-auto"
        >
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl scale-150" />
              <Sparkles className="h-12 w-12 text-amber-400 relative z-10 drop-shadow-lg" />
            </div>
          </div>
          <h1
            className={`text-2xl md:text-3xl font-bold text-white drop-shadow-lg ${isRTL ? "font-arabic" : ""}`}
            data-testid="text-rules-title"
          >
            {t("howToPlayTitle")}
          </h1>
          <p className={`text-blue-100/70 text-sm ${isRTL ? "font-arabic" : ""}`} data-testid="text-rules-subtitle">
            {t("howToPlaySubtitle")}
          </p>
        </motion.div>
      </div>

      <div className="flex-1 p-4 md:p-6 islamic-pattern">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation("/")}
              data-testid="button-back-rules"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-2 flex-1 justify-center">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.key;
                return (
                  <Button
                    key={section.key}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveSection(section.key)}
                    data-testid={`button-section-${section.key}`}
                  >
                    <Icon className={`h-4 w-4 ${!isActive ? section.color : ""}`} />
                    <span className={isRTL ? "font-arabic" : ""}>{section.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {currentSections.map((section, i) => (
              <SectionBlock
                key={section.sectionId}
                sectionId={section.sectionId}
                title={section.title}
                titleIcon={section.titleIcon}
                iconColor={section.iconColor}
                steps={section.steps}
                isRTL={isRTL}
                delay={0.1 * i}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center pt-2 pb-4"
          >
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              data-testid="button-back-rules-bottom"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className={isRTL ? "font-arabic" : ""}>{t("backToHome")}</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
