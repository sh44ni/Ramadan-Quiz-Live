import { useTranslation } from "react-i18next";
import { useLanguage } from "@/lib/useLanguage";
import { Button } from "@/components/ui/button";
import logoImg from "@assets/logoo_1771549026301.png";

export function MosqueHeader() {
  const { t } = useTranslation();
  const { language, toggleLanguage, isRTL } = useLanguage();

  return (
    <header className="relative bg-white dark:bg-gray-950 border-b overflow-hidden">
      <div className="relative z-10 flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Logo" className="h-12 object-contain" data-testid="img-logo" />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          data-testid="button-language-toggle"
        >
          {language === "ar" ? "English" : "العربية"}
        </Button>
      </div>
    </header>
  );
}
