import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { Button } from "@/components/ui/button";
import { Moon } from "lucide-react";
import logoImg from "@assets/logoo_1771549026301.png";

export function MosqueHeader() {
  const { t } = useTranslation();
  const { language, toggleLanguage, isRTL } = useLanguage();

  return (
    <header
      className="relative bg-background border-b z-50 sticky top-0"
      data-testid="header-main"
    >
      <div className="relative z-10 flex items-center justify-between gap-4 px-4 py-2 md:px-6">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Logo" className="h-11 object-contain" data-testid="img-logo" />
        </div>

        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-amber-500 fill-amber-500" />
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            data-testid="button-language-toggle"
          >
            {language === "ar" ? "English" : "العربية"}
          </Button>
        </div>
      </div>
    </header>
  );
}
