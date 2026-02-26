import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, KeyRound, ArrowLeft, Loader2, Moon, Star } from "lucide-react";
import logoImg from "@assets/logoo_1771549026301.png";

export default function Login() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/request-otp", { email: email.trim() });
      const data = await res.json();
      setStep("otp");
      toast({ title: t("otpSent"), description: t("checkEmail") });
    } catch (error: any) {
      const msg = error?.message || "";
      if (msg.includes("403") || msg.includes("not authorized")) {
        toast({ title: t("error"), description: t("emailNotAuthorized"), variant: "destructive" });
      } else {
        toast({ title: t("error"), description: t("otpSendFailed"), variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/verify-otp", { email: email.trim(), code: otp.trim() });
      const data = await res.json();
      localStorage.setItem("playerToken", data.token);
      localStorage.setItem("playerEmail", data.email);
      if (data.playerName) localStorage.setItem("playerName", data.playerName);
      toast({ title: t("loginSuccess"), description: data.playerName ? `${t("welcomePlayer")} ${data.playerName}` : t("welcomePlayer") });
      setLocation("/game");
    } catch (error) {
      toast({ title: t("error"), description: t("invalidOtp"), variant: "destructive" });
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
                {step === "email" ? t("enterEmailDesc") : t("enterOtpDesc")}
              </p>
            </div>

            {step === "email" ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-3"
              >
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRequestOtp()}
                    className="ps-10"
                    dir="ltr"
                    data-testid="input-player-email"
                  />
                </div>
                <Button
                  className="w-full gold-gradient border-amber-400/30 text-white font-bold"
                  onClick={handleRequestOtp}
                  disabled={isLoading || !email.trim()}
                  isLoading={isLoading}
                  data-testid="button-request-otp"
                >
                  <span className={isRTL ? "font-arabic" : ""}>{t("sendOtp")}</span>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-3"
              >
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2" dir="ltr">{email}</p>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                    className="ps-10 text-center tracking-widest text-lg font-mono"
                    dir="ltr"
                    maxLength={6}
                    data-testid="input-otp-code"
                  />
                </div>
                <Button
                  className="w-full gold-gradient border-amber-400/30 text-white font-bold"
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  isLoading={isLoading}
                  data-testid="button-verify-otp"
                >
                  <span className={isRTL ? "font-arabic" : ""}>{t("verifyOtp")}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => { setStep("email"); setOtp(""); }}
                  data-testid="button-change-email"
                >
                  <span className={isRTL ? "font-arabic" : ""}>{t("changeEmail")}</span>
                </Button>
              </motion.div>
            )}

            <Button
              variant="outline"
              className="w-full"
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
