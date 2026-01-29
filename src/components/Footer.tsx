import { useTranslation } from "react-i18next";
import { Wind, Mail } from "lucide-react";

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Wind className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">Calm Breath</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            <a 
              href="mailto:calmbreath59@gmail.com" 
              className="hover:text-foreground transition-colors"
            >
              calmbreath59@gmail.com
            </a>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
};
