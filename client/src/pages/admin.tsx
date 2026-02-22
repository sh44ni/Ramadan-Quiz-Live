import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Scoreboard } from "@/components/scoreboard";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useGameSocket } from "@/lib/useGameSocket";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  ArrowLeft,
  Shield,
  Lock,
  Users,
  Plus,
  Minus,
  Eye,
  SkipForward,
  Mail,
  Trash2,
  Send,
  Loader2,
  Upload,
  Crown,
  Star,
  Sparkles,
  Activity,
  HelpCircle,
  CheckCircle2,
  Monitor,
  Wifi,
  WifiOff,
  Timer,
  ArrowRight,
  CircleStop,
  Search,
  Pencil,
  ChevronDown,
  ChevronUp,
  BookOpen,
  List,
  Lightbulb,
  Monitor as MonitorIcon,
  Languages,
  BarChart3,
} from "lucide-react";
import type { Team, GameSession, TeamScore, AuthorizedEmail, Category, Question } from "@shared/schema";

export default function Admin() {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [password, setPassword] = useState("");
  const [scoreAdjust, setScoreAdjust] = useState<Record<number, number>>({});
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newTeamId, setNewTeamId] = useState<string>("");
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [showAdminGuide, setShowAdminGuide] = useState(false);

  const {
    gameState: wsGameState,
    timer: wsTimer,
    answerResult: wsAnswerResult,
    teamCompleted: wsTeamCompleted,
    connected: wsConnected,
    adminStart,
    adminPause,
    adminResume,
    adminEnd,
    adminReset,
    adminSkip,
    adminSetTeam,
    adminAdjustScore,
    adminNextQuestion,
    adminStartTimer,
    adminShowAnswer,
    adminResetTimer,
    adminSelectSpecificQuestion,
  } = useGameSocket();

  const [qbSearch, setQbSearch] = useState("");
  const [qbCategoryFilter, setQbCategoryFilter] = useState("all");
  const [qbDifficultyFilter, setQbDifficultyFilter] = useState("all");
  const [qbExpanded, setQbExpanded] = useState(false);
  const [qbShowForm, setQbShowForm] = useState(false);
  const [qbEditingId, setQbEditingId] = useState<number | null>(null);
  const [qbForm, setQbForm] = useState({
    textEn: "", textAr: "",
    optionAEn: "", optionAAr: "",
    optionBEn: "", optionBAr: "",
    optionCEn: "", optionCAr: "",
    optionDEn: "", optionDAr: "",
    correctAnswer: "a",
    categoryEn: "", categoryAr: "",
    difficulty: "medium",
  });
  const [catFormNameEn, setCatFormNameEn] = useState("");
  const [catFormNameAr, setCatFormNameAr] = useState("");
  const [catFormColor, setCatFormColor] = useState("#6B7280");
  const [showCatManager, setShowCatManager] = useState(false);
  const [msExpanded, setMsExpanded] = useState(true);
  const [msCategoryFilter, setMsCategoryFilter] = useState("all");
  const [msDifficultyFilter, setMsDifficultyFilter] = useState("all");

  const adminFetch = async (method: string, url: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    return res;
  };

  const { data: sessionData, isLoading: sessionLoading } = useQuery<{
    session: GameSession;
    scores: TeamScore[];
    answeredQuestionIds: number[];
  } | null>({
    queryKey: ["/api/game/current"],
    refetchInterval: 2000,
    enabled: isAuthenticated,
  });

  const { data: teamsData, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    enabled: isAuthenticated,
  });

  const { data: questionsData } = useQuery<any[]>({
    queryKey: ["/api/questions"],
    enabled: isAuthenticated,
  });

  const { data: authorizedEmailsData } = useQuery<AuthorizedEmail[]>({
    queryKey: ["/api/admin/authorized-emails"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await adminFetch("GET", "/api/admin/authorized-emails");
      return res.json();
    },
  });

  const { data: categoriesData } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated,
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (body: typeof qbForm) => {
      const res = await adminFetch("POST", "/api/questions", { ...body, isActive: true });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setQbShowForm(false);
      setQbEditingId(null);
      setQbForm({ textEn: "", textAr: "", optionAEn: "", optionAAr: "", optionBEn: "", optionBAr: "", optionCEn: "", optionCAr: "", optionDEn: "", optionDAr: "", correctAnswer: "a", categoryEn: "", categoryAr: "", difficulty: "medium" });
      toast({ title: t("questionAdded"), description: t("questionAddedDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: typeof qbForm }) => {
      const res = await adminFetch("PUT", `/api/questions/${id}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setQbShowForm(false);
      setQbEditingId(null);
      setQbForm({ textEn: "", textAr: "", optionAEn: "", optionAAr: "", optionBEn: "", optionBAr: "", optionCEn: "", optionCAr: "", optionDEn: "", optionDAr: "", correctAnswer: "a", categoryEn: "", categoryAr: "", difficulty: "medium" });
      toast({ title: t("questionUpdated"), description: t("questionUpdatedDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch("DELETE", `/api/questions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({ title: t("questionDeleted"), description: t("questionDeletedDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch("POST", "/api/categories", { nameEn: catFormNameEn, nameAr: catFormNameAr, color: catFormColor });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setCatFormNameEn("");
      setCatFormNameAr("");
      setCatFormColor("#6B7280");
      toast({ title: t("categoryAdded"), description: t("categoryAddedDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch("DELETE", `/api/categories/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: t("categoryDeleted"), description: t("categoryDeletedDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/login", { password });
      return res.json();
    },
    onSuccess: (data: { token: string }) => {
      setAdminToken(data.token);
      setIsAuthenticated(true);
      toast({ title: t("login"), description: "Authenticated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Invalid password", variant: "destructive" });
    },
  });

  const gameActionMutation = useMutation({
    mutationFn: async (action: string) => {
      const res = await adminFetch("POST", `/api/game/${action}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game/current"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const scoreAdjustMutation = useMutation({
    mutationFn: async ({ teamId, points }: { teamId: number; points: number }) => {
      const res = await adminFetch("POST", "/api/game/adjust-score", { teamId, points });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game/current"] });
      setScoreAdjust({});
    },
  });

  const skipMutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch("POST", "/api/game/skip");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game/current"] });
    },
  });

  const addEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch("POST", "/api/admin/authorized-emails", {
        email: newEmail.trim(),
        name: newName.trim(),
        playerName: newPlayerName.trim() || undefined,
        teamId: newTeamId && newTeamId !== "none" ? Number(newTeamId) : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/authorized-emails"] });
      setNewEmail("");
      setNewName("");
      setNewPlayerName("");
      setNewTeamId("");
      toast({ title: t("emailAdded"), description: t("emailAddedDesc") });
    },
    onError: (error: Error) => {
      const msg = error.message;
      if (msg.includes("409")) {
        toast({ title: t("error"), description: t("emailExists"), variant: "destructive" });
      } else {
        toast({ title: t("error"), description: msg, variant: "destructive" });
      }
    },
  });

  const removeEmailMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch("DELETE", `/api/admin/authorized-emails/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/authorized-emails"] });
      toast({ title: t("emailRemoved"), description: t("emailRemovedDesc") });
    },
  });

  const sendInvitationMutation = useMutation({
    mutationFn: async ({ email, name }: { email: string; name: string }) => {
      const res = await adminFetch("POST", "/api/admin/send-invitation", { email, name });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("invitationSent"), description: t("invitationSentDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async () => {
      const lines = bulkText.trim().split("\n").filter(Boolean);
      const results = [];
      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length >= 2) {
          const [email, playerName, teamIdStr] = parts;
          try {
            const res = await adminFetch("POST", "/api/admin/authorized-emails", {
              email,
              name: playerName,
              playerName,
              teamId: teamIdStr ? Number(teamIdStr) : undefined,
            });
            results.push(await res.json());
          } catch (e) {
          }
        }
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/authorized-emails"] });
      setBulkText("");
      setShowBulk(false);
      toast({ title: t("imported"), description: t("importedDesc") });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-52px)] flex items-center justify-center ramadan-gradient relative overflow-hidden">
        <div className="mosque-silhouette opacity-15" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{ opacity: [0.1, 0.4, 0.1] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.5 }}
            >
              <Star className="h-2 w-2 text-amber-300 fill-amber-300" />
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm relative z-10 p-4"
        >
          <Card className="p-6 space-y-5 bg-background/95 backdrop-blur-sm">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h2 className={`text-xl font-bold ${isRTL ? "font-arabic" : ""}`}>{t("adminLogin")}</h2>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder={t("password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate()}
                  className="ps-10"
                  data-testid="input-admin-password"
                />
              </div>
              <Button
                className="w-full gold-gradient border-amber-400/30 text-white font-bold"
                onClick={() => loginMutation.mutate()}
                disabled={loginMutation.isPending || !password}
                data-testid="button-admin-login"
              >
                {loginMutation.isPending ? "..." : t("login")}
              </Button>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className={isRTL ? "font-arabic" : ""}>{t("backToHome")}</span>
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  const session = wsGameState.session;
  const scores = wsGameState.scores || [];
  const teams = teamsData || wsGameState.teams || [];
  const authorizedEmails = authorizedEmailsData || [];
  const allQuestions = questionsData || wsGameState.questions || [];
  const totalQuestions = allQuestions.length || 36;
  const answeredQuestionIds = wsGameState.answeredQuestionIds || [];
  const answeredCount = answeredQuestionIds.length;
  const currentQuestion = wsGameState.currentQuestion;
  const currentTeam = teams.find((t: Team) => t.id === session?.currentTeamId);

  const isLoading = teamsLoading;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 islamic-pattern">
        <Skeleton className="h-12 w-full rounded-md" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  const statusColor =
    session?.status === "active"
      ? "bg-emerald-500"
      : session?.status === "paused"
        ? "bg-amber-500"
        : session?.status === "finished"
          ? "bg-red-500"
          : "bg-muted-foreground";

  const statusText =
    session?.status === "active"
      ? t("active")
      : session?.status === "paused"
        ? t("paused")
        : session?.status === "finished"
          ? t("finished")
          : t("waiting");

  const getTeamName = (teamId: number) => {
    const team = teams.find((t: Team) => t.id === teamId);
    if (!team) return "";
    return language === "ar" ? team.nameAr : team.nameEn;
  };

  const nextUnansweredQuestion = allQuestions.find((q: any) => !answeredQuestionIds.includes(q.id));
  const questionIndex = currentQuestion
    ? allQuestions.findIndex((q: any) => q.id === currentQuestion.id) + 1
    : 0;

  const currentTeamQuestionsAnswered = session && currentTeam
    ? scores.find((s: TeamScore) => s.teamId === currentTeam.id)?.questionsAnswered || 0
    : 0;

  return (
    <div className="p-3 md:p-5 space-y-4 islamic-pattern min-h-[calc(100vh-52px)]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setLocation("/")} data-testid="button-back-admin">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className={`text-xl font-bold ${isRTL ? "font-arabic" : ""}`} data-testid="text-admin-title">
            {t("admin")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${statusColor} ${session?.status === "active" ? "animate-pulse" : ""}`} />
            <span className="text-sm font-medium" data-testid="text-game-status">{statusText}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/game")} data-testid="button-view-game-admin">
            <Eye className="h-4 w-4" />
            <span className={isRTL ? "font-arabic" : ""}>{t("viewGame")}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open("/display", "_blank")} data-testid="button-open-display">
            <Monitor className="h-4 w-4" />
            <span className={isRTL ? "font-arabic" : ""}>{t("displayScreen") || "Display"}</span>
          </Button>
          {wsConnected ? (
            <Badge variant="secondary" className="gap-1 text-emerald-500 text-xs">
              <Wifi className="h-3 w-3" /> Live
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1 text-xs">
              <WifiOff className="h-3 w-3" /> Offline
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-blue-500" />
            <span className={`text-xs text-muted-foreground ${isRTL ? "font-arabic" : ""}`}>{t("teams")}</span>
          </div>
          <p className="text-2xl font-bold">{teams.length}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="h-4 w-4 text-amber-500" />
            <span className={`text-xs text-muted-foreground ${isRTL ? "font-arabic" : ""}`}>{t("questions")}</span>
          </div>
          <p className="text-2xl font-bold">{answeredCount}/{totalQuestions}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="h-4 w-4 text-emerald-500" />
            <span className={`text-xs text-muted-foreground ${isRTL ? "font-arabic" : ""}`}>{t("manageEmails")}</span>
          </div>
          <p className="text-2xl font-bold">{authorizedEmails.length}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-purple-500" />
            <span className={`text-xs text-muted-foreground ${isRTL ? "font-arabic" : ""}`}>{t("gameStatus")}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className={`w-2.5 h-2.5 rounded-full ${statusColor} ${session?.status === "active" ? "animate-pulse" : ""}`} />
            <span className="text-sm font-semibold">{statusText}</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-4">
          <h3
            className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            {t("gameControls")}
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {(!session || session.status === "waiting" || session.status === "finished") && (
              <Button
                onClick={() => { adminStart(); setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/game/current"] }), 500); }}
                className="col-span-2 gold-gradient border-amber-400/30 text-white font-bold"
                data-testid="button-start-game"
              >
                <Play className="h-4 w-4" />
                <span className={isRTL ? "font-arabic" : ""}>{t("startNewGame")}</span>
              </Button>
            )}

            {session?.status === "active" && (
              <Button
                variant="secondary"
                onClick={() => { adminPause(); setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/game/current"] }), 500); }}
                data-testid="button-pause"
              >
                <Pause className="h-4 w-4" />
                <span className={isRTL ? "font-arabic" : ""}>{t("pauseGame")}</span>
              </Button>
            )}

            {session?.status === "paused" && (
              <Button
                onClick={() => { adminResume(); setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/game/current"] }), 500); }}
                data-testid="button-resume"
              >
                <Play className="h-4 w-4" />
                <span className={isRTL ? "font-arabic" : ""}>{t("resumeGame")}</span>
              </Button>
            )}

            {session && session.status !== "waiting" && session.status !== "finished" && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => { adminSkip(); setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/game/current"] }), 500); }}
                  data-testid="button-skip"
                >
                  <SkipForward className="h-4 w-4" />
                  <span className={isRTL ? "font-arabic" : ""}>{t("nextTeam")}</span>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => { adminEnd(); setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/game/current"] }), 500); }}
                  data-testid="button-end"
                >
                  <Square className="h-4 w-4" />
                  <span className={isRTL ? "font-arabic" : ""}>{t("endGame")}</span>
                </Button>
              </>
            )}

            <Button
              variant="outline"
              onClick={() => { adminReset(); setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/game/current"] }), 500); }}
              className={session && session.status !== "waiting" ? "" : "col-span-2"}
              data-testid="button-reset"
            >
              <RotateCcw className="h-4 w-4" />
              <span className={isRTL ? "font-arabic" : ""}>{t("resetGame")}</span>
            </Button>
          </div>

          {session && session.status === "active" && teams.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <span className={`text-xs text-muted-foreground ${isRTL ? "font-arabic" : ""}`}>
                {t("setCurrentTeam") || "Set Current Team"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {teams.map((team: Team) => (
                  <Button
                    key={team.id}
                    size="sm"
                    variant={session.currentTeamId === team.id ? "default" : "outline"}
                    onClick={() => { adminSetTeam(team.id); setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/game/current"] }), 500); }}
                    className="text-xs"
                    data-testid={`button-set-team-${team.id}`}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />
                    <span className={isRTL ? "font-arabic" : ""}>{language === "ar" ? team.nameAr : team.nameEn}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {session && (session.status === "active" || session.status === "paused") && (
          <Card className="p-4 space-y-4 ring-2 ring-amber-500/30">
            <h3
              className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}
            >
              <HelpCircle className="h-4 w-4 text-blue-500" />
              {t("questionControl")}
            </h3>

            {currentTeam && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: currentTeam.color }}>
                  <Users className="h-3 w-3" />
                </div>
                <span className={`text-sm font-bold ${isRTL ? "font-arabic" : ""}`}>
                  {language === "ar" ? currentTeam.nameAr : currentTeam.nameEn}
                </span>
                <Badge variant="secondary" className="text-xs ms-auto">
                  {currentTeamQuestionsAnswered}/5 {t("questions")}
                </Badge>
              </div>
            )}

            {wsTeamCompleted && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 font-medium text-sm"
                data-testid="notification-team-completed"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className={isRTL ? "font-arabic" : ""}>
                  {getTeamName(wsTeamCompleted.completedTeamId)} {t("teamCompletedMoving") || "completed!"} → {getTeamName(wsTeamCompleted.nextTeamId)}
                </span>
              </motion.div>
            )}

            {currentQuestion ? (
              <div className="space-y-3">
                <div className="p-3 rounded-md bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      {t("questionNumber")}{questionIndex}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {language === "ar" ? currentQuestion.categoryAr : currentQuestion.categoryEn}
                    </Badge>
                  </div>
                  <p className={`text-sm font-medium leading-relaxed ${isRTL ? "font-arabic text-right" : ""}`} data-testid="text-admin-question">
                    {language === "ar" ? currentQuestion.textAr : currentQuestion.textEn}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">{t("correctAnswerLabel")}:</span>{" "}
                    <span className="font-bold text-emerald-600">{currentQuestion.correctAnswer.toUpperCase()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-amber-500" />
                    <span className={`text-lg font-bold tabular-nums ${
                      wsTimer.seconds > 20 ? "text-emerald-500" : wsTimer.seconds > 10 ? "text-amber-500" : "text-red-500"
                    }`}>
                      {wsTimer.seconds}s
                    </span>
                  </div>
                  <Badge variant={wsTimer.running ? "default" : "secondary"} className="text-xs">
                    {wsTimer.running ? t("timerRunning") : t("timerStopped")}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => adminStartTimer()}
                    disabled={wsTimer.running}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    data-testid="button-start-timer"
                  >
                    <Play className="h-4 w-4" />
                    <span className={isRTL ? "font-arabic" : ""}>{t("startTimer")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => adminResetTimer()}
                    data-testid="button-reset-timer"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className={isRTL ? "font-arabic" : ""}>{t("resetTimer")}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => adminShowAnswer()}
                    className="col-span-2"
                    data-testid="button-show-answer"
                  >
                    <Eye className="h-4 w-4" />
                    <span className={isRTL ? "font-arabic" : ""}>{t("showAnswer")}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={() => adminNextQuestion()}
                  disabled={!nextUnansweredQuestion || !!wsTeamCompleted}
                  className="w-full gold-gradient border-amber-400/30 text-white font-bold"
                  data-testid="button-next-question"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span className={isRTL ? "font-arabic" : ""}>{t("nextQuestion")}</span>
                </Button>

                <div className="border-t pt-3">
                  <button
                    onClick={() => setMsExpanded(!msExpanded)}
                    className="flex items-center justify-between gap-2 w-full text-left"
                    data-testid="button-toggle-manual-select"
                  >
                    <span className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ${isRTL ? "font-arabic" : ""}`}>
                      <List className="h-3.5 w-3.5" />
                      {t("selectQuestionForTeam")}
                    </span>
                    {msExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {msExpanded && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        <Select value={msCategoryFilter} onValueChange={setMsCategoryFilter}>
                          <SelectTrigger className="flex-1 min-w-[120px]" data-testid="select-ms-category">
                            <SelectValue placeholder={t("filterByCategory")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("allCategories")}</SelectItem>
                            {(categoriesData || []).map((cat: Category) => (
                              <SelectItem key={cat.id} value={cat.nameEn}>{language === "ar" ? cat.nameAr : cat.nameEn}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={msDifficultyFilter} onValueChange={setMsDifficultyFilter}>
                          <SelectTrigger className="flex-1 min-w-[100px]" data-testid="select-ms-difficulty">
                            <SelectValue placeholder={t("filterByDifficulty")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("allDifficulties")}</SelectItem>
                            <SelectItem value="easy">{t("easy")}</SelectItem>
                            <SelectItem value="medium">{t("medium")}</SelectItem>
                            <SelectItem value="hard">{t("hard")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {allQuestions
                          .filter((q: Question) => msCategoryFilter === "all" || q.categoryEn === msCategoryFilter)
                          .filter((q: Question) => msDifficultyFilter === "all" || q.difficulty === msDifficultyFilter)
                          .map((q: Question) => {
                            const isUsed = answeredQuestionIds.includes(q.id);
                            return (
                              <button
                                key={q.id}
                                onClick={() => adminSelectSpecificQuestion(q.id)}
                                className={`w-full text-left p-2 rounded-md text-xs flex items-start gap-2 hover-elevate ${
                                  isUsed ? "opacity-50 bg-muted/20" : "bg-muted/30"
                                }`}
                                data-testid={`button-select-question-${q.id}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium truncate ${isRTL ? "font-arabic text-right" : ""}`}>
                                    {language === "ar" ? q.textAr : q.textEn}
                                  </p>
                                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                                    <Badge variant="secondary" className="text-[9px]">{language === "ar" ? q.categoryAr : q.categoryEn}</Badge>
                                    <Badge variant="outline" className="text-[9px]">{q.difficulty}</Badge>
                                    {isUsed && <Badge variant="destructive" className="text-[9px]">{t("usedQuestions")}</Badge>}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {wsAnswerResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center justify-center gap-2 p-3 rounded-md font-bold ${
                  wsAnswerResult.isCorrect
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-red-500/15 text-red-600"
                }`}
              >
                {wsAnswerResult.isCorrect ? (
                  <><CheckCircle2 className="h-5 w-5" /> {t("correct")} +1</>
                ) : (
                  <><CircleStop className="h-5 w-5" /> {t("incorrect")}</>
                )}
              </motion.div>
            )}
          </Card>
        )}

        {!(session && (session.status === "active" || session.status === "paused")) && (
          <Card className="p-4">
            <Scoreboard teams={teams} scores={scores} currentTeamId={session?.currentTeamId || null} compact />
          </Card>
        )}

        <Card className="p-4">
          <Scoreboard teams={teams} scores={scores} currentTeamId={session?.currentTeamId || null} compact />
        </Card>

        <Card className="p-4 space-y-3 lg:col-span-2">
          <h3
            className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}
          >
            <Plus className="h-4 w-4 text-emerald-500" />
            {t("adjustScore")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map((team: Team) => {
              const teamScore = scores.find((s: TeamScore) => s.teamId === team.id);
              return (
                <div
                  key={team.id}
                  className="flex items-center gap-2 p-3 rounded-md bg-muted/30"
                  style={{ borderLeftColor: team.color, borderLeftWidth: 0 }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: team.color }}
                  >
                    {teamScore?.score || 0}
                  </div>
                  <span className={`text-sm font-medium flex-1 truncate ${isRTL ? "font-arabic" : ""}`}>
                    {language === "ar" ? team.nameAr : team.nameEn}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        adminAdjustScore(team.id, -1);
                        setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/game/current"] }), 500);
                      }}
                      data-testid={`button-remove-points-${team.id}`}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        adminAdjustScore(team.id, 1);
                        setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/game/current"] }), 500);
                      }}
                      data-testid={`button-add-points-${team.id}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={() => setQbExpanded(!qbExpanded)}
              className="flex items-center gap-2"
              data-testid="button-toggle-question-bank"
            >
              <h3
                className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}
              >
                <BookOpen className="h-4 w-4 text-amber-500" />
                {t("questionBank")}
                <Badge variant="secondary" className="text-[10px]">{allQuestions.length}</Badge>
              </h3>
              {qbExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {qbExpanded && (
              <Button
                size="sm"
                onClick={() => {
                  setQbShowForm(true);
                  setQbEditingId(null);
                  setQbForm({ textEn: "", textAr: "", optionAEn: "", optionAAr: "", optionBEn: "", optionBAr: "", optionCEn: "", optionCAr: "", optionDEn: "", optionDAr: "", correctAnswer: "a", categoryEn: "", categoryAr: "", difficulty: "medium" });
                }}
                data-testid="button-add-question"
              >
                <Plus className="h-3 w-3" />
                <span className={isRTL ? "font-arabic" : ""}>{t("addQuestion")}</span>
              </Button>
            )}
          </div>

          {qbExpanded && (
            <div className="space-y-3">
              {qbShowForm && (
                <div className="space-y-3 p-3 rounded-md bg-muted/30" data-testid="form-question">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Textarea placeholder={t("questionTextEn")} value={qbForm.textEn} onChange={(e) => setQbForm({ ...qbForm, textEn: e.target.value })} rows={2} data-testid="input-question-text-en" />
                    <Textarea placeholder={t("questionTextAr")} value={qbForm.textAr} onChange={(e) => setQbForm({ ...qbForm, textAr: e.target.value })} rows={2} className="font-arabic" dir="rtl" data-testid="input-question-text-ar" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Input placeholder={`${t("optionA")} (EN)`} value={qbForm.optionAEn} onChange={(e) => setQbForm({ ...qbForm, optionAEn: e.target.value })} data-testid="input-option-a-en" />
                    <Input placeholder={`${t("optionA")} (AR)`} value={qbForm.optionAAr} onChange={(e) => setQbForm({ ...qbForm, optionAAr: e.target.value })} className="font-arabic" dir="rtl" data-testid="input-option-a-ar" />
                    <Input placeholder={`${t("optionB")} (EN)`} value={qbForm.optionBEn} onChange={(e) => setQbForm({ ...qbForm, optionBEn: e.target.value })} data-testid="input-option-b-en" />
                    <Input placeholder={`${t("optionB")} (AR)`} value={qbForm.optionBAr} onChange={(e) => setQbForm({ ...qbForm, optionBAr: e.target.value })} className="font-arabic" dir="rtl" data-testid="input-option-b-ar" />
                    <Input placeholder={`${t("optionC")} (EN)`} value={qbForm.optionCEn} onChange={(e) => setQbForm({ ...qbForm, optionCEn: e.target.value })} data-testid="input-option-c-en" />
                    <Input placeholder={`${t("optionC")} (AR)`} value={qbForm.optionCAr} onChange={(e) => setQbForm({ ...qbForm, optionCAr: e.target.value })} className="font-arabic" dir="rtl" data-testid="input-option-c-ar" />
                    <Input placeholder={`${t("optionD")} (EN)`} value={qbForm.optionDEn} onChange={(e) => setQbForm({ ...qbForm, optionDEn: e.target.value })} data-testid="input-option-d-en" />
                    <Input placeholder={`${t("optionD")} (AR)`} value={qbForm.optionDAr} onChange={(e) => setQbForm({ ...qbForm, optionDAr: e.target.value })} className="font-arabic" dir="rtl" data-testid="input-option-d-ar" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={qbForm.correctAnswer} onValueChange={(v) => setQbForm({ ...qbForm, correctAnswer: v })}>
                      <SelectTrigger className="w-[120px]" data-testid="select-correct-answer">
                        <SelectValue placeholder={t("correctAnswerSelect")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a">A</SelectItem>
                        <SelectItem value="b">B</SelectItem>
                        <SelectItem value="c">C</SelectItem>
                        <SelectItem value="d">D</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={qbForm.categoryEn || "none"}
                      onValueChange={(v) => {
                        if (v === "none") {
                          setQbForm({ ...qbForm, categoryEn: "", categoryAr: "" });
                        } else {
                          const cat = (categoriesData || []).find((c: Category) => c.nameEn === v);
                          setQbForm({ ...qbForm, categoryEn: v, categoryAr: cat?.nameAr || v });
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1 min-w-[140px]" data-testid="select-question-category">
                        <SelectValue placeholder={t("selectCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("selectCategory")}</SelectItem>
                        {(categoriesData || []).map((cat: Category) => (
                          <SelectItem key={cat.id} value={cat.nameEn}>{language === "ar" ? cat.nameAr : cat.nameEn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={qbForm.difficulty} onValueChange={(v) => setQbForm({ ...qbForm, difficulty: v })}>
                      <SelectTrigger className="w-[120px]" data-testid="select-question-difficulty">
                        <SelectValue placeholder={t("selectDifficulty")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">{t("easy")}</SelectItem>
                        <SelectItem value="medium">{t("medium")}</SelectItem>
                        <SelectItem value="hard">{t("hard")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (qbEditingId) {
                          updateQuestionMutation.mutate({ id: qbEditingId, body: qbForm });
                        } else {
                          createQuestionMutation.mutate(qbForm);
                        }
                      }}
                      disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending || !qbForm.textEn || !qbForm.textAr}
                      data-testid="button-save-question"
                    >
                      {(createQuestionMutation.isPending || updateQuestionMutation.isPending) ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      <span className={isRTL ? "font-arabic" : ""}>{qbEditingId ? t("updateQuestion") : t("saveQuestion")}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setQbShowForm(false); setQbEditingId(null); }}
                      data-testid="button-cancel-question"
                    >
                      <span className={isRTL ? "font-arabic" : ""}>{t("cancel")}</span>
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[150px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t("searchQuestions")}
                    value={qbSearch}
                    onChange={(e) => setQbSearch(e.target.value)}
                    className="ps-8 text-sm"
                    data-testid="input-search-questions"
                  />
                </div>
                <Select value={qbCategoryFilter} onValueChange={setQbCategoryFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-qb-category">
                    <SelectValue placeholder={t("filterByCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allCategories")}</SelectItem>
                    {(categoriesData || []).map((cat: Category) => (
                      <SelectItem key={cat.id} value={cat.nameEn}>{language === "ar" ? cat.nameAr : cat.nameEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={qbDifficultyFilter} onValueChange={setQbDifficultyFilter}>
                  <SelectTrigger className="w-[120px]" data-testid="select-qb-difficulty">
                    <SelectValue placeholder={t("filterByDifficulty")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allDifficulties")}</SelectItem>
                    <SelectItem value="easy">{t("easy")}</SelectItem>
                    <SelectItem value="medium">{t("medium")}</SelectItem>
                    <SelectItem value="hard">{t("hard")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allQuestions
                  .filter((q: Question) => {
                    const search = qbSearch.toLowerCase();
                    if (search && !q.textEn.toLowerCase().includes(search) && !q.textAr.includes(qbSearch)) return false;
                    if (qbCategoryFilter !== "all" && q.categoryEn !== qbCategoryFilter) return false;
                    if (qbDifficultyFilter !== "all" && q.difficulty !== qbDifficultyFilter) return false;
                    return true;
                  })
                  .map((q: Question) => (
                    <div
                      key={q.id}
                      className="flex items-start gap-2 p-2.5 rounded-md bg-muted/30"
                      data-testid={`row-question-${q.id}`}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className={`text-sm font-medium ${isRTL ? "font-arabic text-right" : ""}`}>
                          {language === "ar" ? q.textAr : q.textEn}
                        </p>
                        <p className={`text-xs text-muted-foreground ${isRTL ? "" : ""}`} dir={language === "ar" ? "ltr" : "rtl"}>
                          {language === "ar" ? q.textEn : q.textAr}
                        </p>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Badge variant="secondary" className="text-[9px]">{language === "ar" ? q.categoryAr : q.categoryEn}</Badge>
                          <Badge variant="outline" className="text-[9px]">{q.difficulty}</Badge>
                          <Badge variant="default" className="text-[9px] bg-emerald-600">{t("correctAnswerLabel")}: {q.correctAnswer.toUpperCase()}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setQbEditingId(q.id);
                            setQbShowForm(true);
                            setQbForm({
                              textEn: q.textEn, textAr: q.textAr,
                              optionAEn: q.optionAEn, optionAAr: q.optionAAr,
                              optionBEn: q.optionBEn, optionBAr: q.optionBAr,
                              optionCEn: q.optionCEn, optionCAr: q.optionCAr,
                              optionDEn: q.optionDEn, optionDAr: q.optionDAr,
                              correctAnswer: q.correctAnswer,
                              categoryEn: q.categoryEn, categoryAr: q.categoryAr,
                              difficulty: q.difficulty,
                            });
                          }}
                          data-testid={`button-edit-question-${q.id}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm(t("confirmDelete"))) {
                              deleteQuestionMutation.mutate(q.id);
                            }
                          }}
                          data-testid={`button-delete-question-${q.id}`}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {allQuestions.filter((q: Question) => {
                  const search = qbSearch.toLowerCase();
                  if (search && !q.textEn.toLowerCase().includes(search) && !q.textAr.includes(qbSearch)) return false;
                  if (qbCategoryFilter !== "all" && q.categoryEn !== qbCategoryFilter) return false;
                  if (qbDifficultyFilter !== "all" && q.difficulty !== qbDifficultyFilter) return false;
                  return true;
                }).length === 0 && (
                  <p className={`text-sm text-muted-foreground text-center py-4 ${isRTL ? "font-arabic" : ""}`}>{t("noQuestionsFound")}</p>
                )}
              </div>

              <div className="border-t pt-3">
                <button
                  onClick={() => setShowCatManager(!showCatManager)}
                  className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  data-testid="button-toggle-category-manager"
                >
                  {showCatManager ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {t("manageCategories")}
                </button>
                {showCatManager && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      <Input placeholder={t("categoryNameEn")} value={catFormNameEn} onChange={(e) => setCatFormNameEn(e.target.value)} className="flex-1 min-w-[120px]" data-testid="input-category-name-en" />
                      <Input placeholder={t("categoryNameAr")} value={catFormNameAr} onChange={(e) => setCatFormNameAr(e.target.value)} className="flex-1 min-w-[120px] font-arabic" dir="rtl" data-testid="input-category-name-ar" />
                      <Input type="color" value={catFormColor} onChange={(e) => setCatFormColor(e.target.value)} className="w-12" data-testid="input-category-color" />
                      <Button
                        size="sm"
                        onClick={() => createCategoryMutation.mutate()}
                        disabled={createCategoryMutation.isPending || !catFormNameEn || !catFormNameAr}
                        data-testid="button-add-category"
                      >
                        {createCategoryMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        <span className={isRTL ? "font-arabic" : ""}>{t("addCategory")}</span>
                      </Button>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {(categoriesData || []).map((cat: Category) => (
                        <div key={cat.id} className="flex items-center gap-1 p-1.5 rounded-md bg-muted/30">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-xs">{language === "ar" ? cat.nameAr : cat.nameEn}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => {
                              if (window.confirm(t("confirmDelete"))) {
                                deleteCategoryMutation.mutate(cat.id);
                              }
                            }}
                            data-testid={`button-delete-category-${cat.id}`}
                          >
                            <Trash2 className="h-2.5 w-2.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-3 lg:col-span-2" data-testid="admin-guide-section">
          <button
            className="w-full flex items-center justify-between"
            onClick={() => setShowAdminGuide(!showAdminGuide)}
            data-testid="button-toggle-admin-guide"
          >
            <h3 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}>
              <BookOpen className="h-4 w-4 text-indigo-500" />
              {t("adminGuide")}
            </h3>
            {showAdminGuide ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {showAdminGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4"
            >
              <p className={`text-xs text-muted-foreground ${isRTL ? "font-arabic" : ""}`}>{t("adminGuideDesc")}</p>

              <div className="space-y-3">
                <div className="p-3 rounded-md bg-blue-500/5 space-y-2">
                  <h4 className={`text-xs font-semibold flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}>
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                    {t("adminSetupTitle")}
                  </h4>
                  <div className="space-y-1">
                    {[t("adminSetupStep1"), t("adminSetupStep2"), t("adminSetupStep3"), t("adminSetupStep4")].map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="font-bold text-primary/60 shrink-0">{i + 1}.</span>
                        <span className={isRTL ? "font-arabic" : ""}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-md bg-emerald-500/5 space-y-2">
                  <h4 className={`text-xs font-semibold flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}>
                    <Play className="h-3.5 w-3.5 text-emerald-500" />
                    {t("adminControlsTitle")}
                  </h4>
                  <div className="space-y-1">
                    {[t("adminControlsStep1"), t("adminControlsStep2"), t("adminControlsStep3"), t("adminControlsStep4"), t("adminControlsStep5"), t("adminControlsStep6")].map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="font-bold text-primary/60 shrink-0">{i + 1}.</span>
                        <span className={isRTL ? "font-arabic" : ""}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-md bg-purple-500/5 space-y-2">
                  <h4 className={`text-xs font-semibold flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}>
                    <HelpCircle className="h-3.5 w-3.5 text-purple-500" />
                    {t("adminQuestionsTitle")}
                  </h4>
                  <div className="space-y-1">
                    {[t("adminQuestionsStep1"), t("adminQuestionsStep2"), t("adminQuestionsStep3")].map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="font-bold text-primary/60 shrink-0">{i + 1}.</span>
                        <span className={isRTL ? "font-arabic" : ""}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-md bg-amber-500/5 space-y-2">
                  <h4 className={`text-xs font-semibold flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}>
                    <BarChart3 className="h-3.5 w-3.5 text-amber-500" />
                    {t("adminScoreTitle")}
                  </h4>
                  <div className="space-y-1">
                    {[t("adminScoreStep1"), t("adminScoreStep2"), t("adminScoreStep3")].map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="font-bold text-primary/60 shrink-0">{i + 1}.</span>
                        <span className={isRTL ? "font-arabic" : ""}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-md bg-cyan-500/5 space-y-2">
                  <h4 className={`text-xs font-semibold flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}>
                    <MonitorIcon className="h-3.5 w-3.5 text-cyan-500" />
                    {t("adminDisplayTitle")}
                  </h4>
                  <div className="space-y-1">
                    {[t("adminDisplayStep1"), t("adminDisplayStep2"), t("adminDisplayStep3")].map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="font-bold text-primary/60 shrink-0">{i + 1}.</span>
                        <span className={isRTL ? "font-arabic" : ""}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-md bg-amber-500/5 space-y-2">
                  <h4 className={`text-xs font-semibold flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}>
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    {t("tipsTitle")}
                  </h4>
                  <div className="space-y-1">
                    {[t("tip1"), t("tip2"), t("tip3"), t("tip4"), t("tip5"), t("tip6")].map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="text-amber-500 shrink-0">&#x2022;</span>
                        <span className={isRTL ? "font-arabic" : ""}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </Card>

        <Card className="p-4 space-y-4 lg:col-span-2">
          <h3
            className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}
          >
            <Users className="h-4 w-4 text-blue-500" />
            {t("teamRoster")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map((team: Team) => (
              <Card key={team.id} className="p-0 overflow-visible relative">
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-md"
                  style={{ backgroundColor: team.color }}
                />
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: team.color }}
                    >
                      <Users className="h-3 w-3" />
                    </div>
                    <span className={`text-sm font-bold ${isRTL ? "font-arabic" : ""}`}>
                      {language === "ar" ? team.nameAr : team.nameEn}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs p-1.5 rounded bg-amber-500/10">
                      <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                      <span className="font-arabic font-medium">{team.captain}</span>
                    </div>
                    {team.members && team.members.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground ps-4">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                        <span className="font-arabic">{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="p-4 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3
              className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 ${isRTL ? "font-arabic" : ""}`}
            >
              <Mail className="h-4 w-4 text-emerald-500" />
              {t("manageEmails")}
              <Badge variant="secondary" className="text-[10px]">{authorizedEmails.length}</Badge>
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulk(!showBulk)}
              data-testid="button-toggle-bulk"
            >
              <Upload className="h-3 w-3" />
              <span className={isRTL ? "font-arabic" : ""}>{t("bulkImport")}</span>
            </Button>
          </div>

          {showBulk && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2 p-3 rounded-md bg-muted/30"
            >
              <Textarea
                placeholder={t("bulkImportPlaceholder")}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={4}
                dir="ltr"
                className="text-xs font-mono"
                data-testid="input-bulk-import"
              />
              <Button
                size="sm"
                onClick={() => bulkImportMutation.mutate()}
                disabled={bulkImportMutation.isPending || !bulkText.trim()}
                data-testid="button-bulk-import"
              >
                {bulkImportMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                <span className={isRTL ? "font-arabic" : ""}>{t("importEmails")}</span>
              </Button>
            </motion.div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder={t("emailAddress")}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                dir="ltr"
                data-testid="input-new-email"
              />
              <Input
                type="text"
                placeholder={t("playerName")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                data-testid="input-new-name"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder={t("playerName") + " (" + t("arabic") + ")"}
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="font-arabic"
                data-testid="input-new-player-name"
              />
              <Select value={newTeamId} onValueChange={setNewTeamId}>
                <SelectTrigger data-testid="select-team-assignment">
                  <SelectValue placeholder={t("selectTeamAssignment")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noTeam")}</SelectItem>
                  {teams.map((team: Team) => (
                    <SelectItem key={team.id} value={String(team.id)}>
                      {language === "ar" ? team.nameAr : team.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => addEmailMutation.mutate()}
                disabled={addEmailMutation.isPending || !newEmail.trim() || !newName.trim()}
                className="shrink-0"
                data-testid="button-add-email"
              >
                {addEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span className={isRTL ? "font-arabic" : ""}>{t("addEmail")}</span>
              </Button>
            </div>
          </div>

          {authorizedEmails.length === 0 ? (
            <p className={`text-sm text-muted-foreground text-center py-6 ${isRTL ? "font-arabic" : ""}`}>
              {t("noAuthorizedEmails")}
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {authorizedEmails.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-2.5 rounded-md bg-muted/30"
                  data-testid={`row-email-${entry.id}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate" dir="ltr">{entry.email}</span>
                      {entry.playerName && (
                        <span className="text-xs text-muted-foreground font-arabic">({entry.playerName})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">{entry.name}</span>
                      {entry.teamId && (
                        <Badge variant="secondary" className="text-[10px]">
                          {getTeamName(entry.teamId)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        sendInvitationMutation.mutate({ email: entry.email, name: entry.name })
                      }
                      disabled={sendInvitationMutation.isPending}
                      data-testid={`button-send-invitation-${entry.id}`}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeEmailMutation.mutate(entry.id)}
                      disabled={removeEmailMutation.isPending}
                      data-testid={`button-remove-email-${entry.id}`}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
