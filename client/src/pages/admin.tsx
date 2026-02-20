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
} from "lucide-react";
import type { Team, GameSession, TeamScore, AuthorizedEmail } from "@shared/schema";

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

  const { data: authorizedEmailsData } = useQuery<AuthorizedEmail[]>({
    queryKey: ["/api/admin/authorized-emails"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await adminFetch("GET", "/api/admin/authorized-emails");
      return res.json();
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
            // skip duplicates
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
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4 islamic-pattern">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <Card className="p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
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
                className="w-full"
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

  const session = sessionData?.session;
  const scores = sessionData?.scores || [];
  const teams = teamsData || [];
  const authorizedEmails = authorizedEmailsData || [];

  const isLoading = sessionLoading || teamsLoading;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const statusColor =
    session?.status === "active"
      ? "text-emerald-500"
      : session?.status === "paused"
        ? "text-amber-500"
        : session?.status === "finished"
          ? "text-red-500"
          : "text-muted-foreground";

  const statusText =
    session?.status === "active"
      ? t("active")
      : session?.status === "paused"
        ? t("paused")
        : session?.status === "finished"
          ? t("finished")
          : t("waiting");

  const getTeamName = (teamId: number) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return "";
    return language === "ar" ? team.nameAr : team.nameEn;
  };

  return (
    <div className="p-3 md:p-5 space-y-4 islamic-pattern min-h-[calc(100vh-56px)]">
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
          <Badge variant="outline" className={statusColor} data-testid="text-game-status">
            {statusText}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setLocation("/game")} data-testid="button-view-game-admin">
            <Eye className="h-4 w-4" />
            <span className={isRTL ? "font-arabic" : ""}>{t("viewGame")}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-4">
          <h3
            className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider ${isRTL ? "font-arabic" : ""}`}
          >
            {t("gameControls")}
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {(!session || session.status === "waiting" || session.status === "finished") && (
              <Button
                onClick={() => gameActionMutation.mutate("start")}
                disabled={gameActionMutation.isPending}
                className="col-span-2"
                data-testid="button-start-game"
              >
                <Play className="h-4 w-4" />
                <span className={isRTL ? "font-arabic" : ""}>{t("startNewGame")}</span>
              </Button>
            )}

            {session?.status === "active" && (
              <Button
                variant="secondary"
                onClick={() => gameActionMutation.mutate("pause")}
                disabled={gameActionMutation.isPending}
                data-testid="button-pause"
              >
                <Pause className="h-4 w-4" />
                <span className={isRTL ? "font-arabic" : ""}>{t("pauseGame")}</span>
              </Button>
            )}

            {session?.status === "paused" && (
              <Button
                onClick={() => gameActionMutation.mutate("resume")}
                disabled={gameActionMutation.isPending}
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
                  onClick={() => skipMutation.mutate()}
                  disabled={skipMutation.isPending}
                  data-testid="button-skip"
                >
                  <SkipForward className="h-4 w-4" />
                  <span className={isRTL ? "font-arabic" : ""}>{t("nextTeam")}</span>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => gameActionMutation.mutate("end")}
                  disabled={gameActionMutation.isPending}
                  data-testid="button-end"
                >
                  <Square className="h-4 w-4" />
                  <span className={isRTL ? "font-arabic" : ""}>{t("endGame")}</span>
                </Button>
              </>
            )}

            <Button
              variant="outline"
              onClick={() => gameActionMutation.mutate("reset")}
              disabled={gameActionMutation.isPending}
              className={session && session.status !== "waiting" ? "" : "col-span-2"}
              data-testid="button-reset"
            >
              <RotateCcw className="h-4 w-4" />
              <span className={isRTL ? "font-arabic" : ""}>{t("resetGame")}</span>
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <Scoreboard teams={teams} scores={scores} currentTeamId={session?.currentTeamId || null} />
        </Card>

        <Card className="p-4 space-y-3 lg:col-span-2">
          <h3
            className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider ${isRTL ? "font-arabic" : ""}`}
          >
            {t("adjustScore")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
              >
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                <span className={`text-sm font-medium flex-1 truncate ${isRTL ? "font-arabic" : ""}`}>
                  {language === "ar" ? team.nameAr : team.nameEn}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      scoreAdjustMutation.mutate({ teamId: team.id, points: -10 })
                    }
                    data-testid={`button-remove-points-${team.id}`}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      scoreAdjustMutation.mutate({ teamId: team.id, points: 10 })
                    }
                    data-testid={`button-add-points-${team.id}`}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 space-y-4 lg:col-span-2">
          <h3
            className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider ${isRTL ? "font-arabic" : ""}`}
          >
            <Users className="h-4 w-4 inline-block me-2" />
            {t("teamRoster")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map((team) => (
              <div key={team.id} className="p-3 rounded-md bg-muted/30 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                  <span className={`text-sm font-bold ${isRTL ? "font-arabic" : ""}`}>
                    {language === "ar" ? team.nameAr : team.nameEn}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Crown className="h-3 w-3 text-amber-500" />
                    <span className="font-arabic font-medium">{team.captain}</span>
                  </div>
                  {team.members && team.members.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground ps-4">
                      <span className="font-arabic">{member}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3
              className={`text-sm font-semibold text-muted-foreground uppercase tracking-wider ${isRTL ? "font-arabic" : ""}`}
            >
              <Mail className="h-4 w-4 inline-block me-2" />
              {t("manageEmails")}
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
            <div className="space-y-2 p-3 rounded-md bg-muted/30">
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
            </div>
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
                  {teams.map((team) => (
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
            <p className={`text-sm text-muted-foreground text-center py-4 ${isRTL ? "font-arabic" : ""}`}>
              {t("noAuthorizedEmails")}
            </p>
          ) : (
            <div className="space-y-2">
              {authorizedEmails.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
                  data-testid={`email-entry-${entry.id}`}
                >
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{entry.name}</p>
                      {entry.playerName && (
                        <span className="text-xs text-muted-foreground font-arabic">({entry.playerName})</span>
                      )}
                      {entry.teamId && (
                        <Badge variant="secondary" className="text-xs">
                          {getTeamName(entry.teamId)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate" dir="ltr">{entry.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => sendInvitationMutation.mutate({ email: entry.email, name: entry.name })}
                      disabled={sendInvitationMutation.isPending}
                      data-testid={`button-send-invitation-${entry.id}`}
                    >
                      {sendInvitationMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => removeEmailMutation.mutate(entry.id)}
                      disabled={removeEmailMutation.isPending}
                      data-testid={`button-remove-email-${entry.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
