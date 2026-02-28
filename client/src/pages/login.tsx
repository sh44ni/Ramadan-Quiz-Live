import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, ArrowLeft, Loader2, Star } from "lucide-react";
import logoImg from "@assets/logoo_1771549026301.png";
import type { Team } from "@shared/schema";

export default function Login() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [secretKey, setSecretKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const handleLogin = async () => {
    if (!selectedTeamId || !secretKey.trim()) return;
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login-team", {
        teamId: selectedTeamId,
        secretKey: secretKey.trim()
      });
      const data = await res.json();
      localStorage.setItem("playerToken", data.token);
      localStorage.setItem("teamId", data.teamId.toString());
      if (data.playerName) localStorage.setItem("playerName", data.playerName);
      toast({
        title: t("loginSuccess"),
        description: data.playerName ? `${t("welcomePlayer").replace("{{name}}", data.playerName)}` : t("loginSuccess")
      });
      setLocation("/game");
    } catch (error: any) {
      toast({ title: t("error"), description: t("invalidSecret"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-52px)] flex flex-col">
      <div className="relative ramadan-gradient flex-1 flex items-center justify-center p-4">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: `${10 + i * 12}%`, top: `${15 + (i % 3) * 25}%` }}
              animate={{ opacity: [0.15, 0.5, 0.15], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
            >
              <Star className="h-2 w-2 text-amber-300 fill-amber-300" />
            </motion.div>
          ))}
        </div>
        <div className="mosque-silhouette opacity-15" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm relative z-10"
        >
          <Card className="p-6 space-y-5 bg-background/95 backdrop-blur-sm">
            <div className="text-center space-y-3">
              <motion.div
                className="flex justify-center"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <img src={logoImg} alt="Logo" className="h-16 object-contain" />
              </motion.div>
              <h2 className={`text-xl font-bold ${isRTL ? "font-arabic" : ""}`} data-testid="text-login-title">
                {t("playerLogin")}
              </h2>
              <p className={`text-sm text-muted-foreground ${isRTL ? "font-arabic" : ""}`}>
                {t("enterSecretDesc")}
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId} disabled={isLoadingTeams}>
                  <SelectTrigger className={isRTL ? "text-right" : "text-left"}>
                    <SelectValue placeholder={isLoadingTeams ? "..." : t("selectTeamToLogin")} />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {isRTL ? team.nameAr : team.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("teamSecretPlaceholder")}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="ps-10 text-center tracking-widest text-lg font-mono"
                  dir="ltr"
                  maxLength={6}
                  data-testid="input-secret-key"
                />
              </div>

              <Button
                className="w-full gold-gradient border-amber-400/30 text-white font-bold"
                onClick={handleLogin}
                disabled={isLoading || !selectedTeamId || secretKey.length !== 6}
                isLoading={isLoading}
                data-testid="button-login-team"
              >
                <span className={isRTL ? "font-arabic" : ""}>{t("verifySecret")}</span>
              </Button>
            </motion.div>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setLocation("/")}
              data-testid="button-back-login"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className={isRTL ? "font-arabic" : ""}>{t("backToHome")}</span>
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
