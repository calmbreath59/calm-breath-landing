import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import logo from "@/assets/calm-breath-logo.png";

export const Header = () => {
  const { t } = useTranslation();
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleAuth = () => {
    if (user) {
      if (profile?.has_paid || isAdmin) {
        navigate("/dashboard");
      } else {
        navigate("/payment");
      }
    } else {
      navigate("/auth");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logo} alt="Calm Breath" className="w-10 h-10" />
            <span className="text-xl font-bold text-foreground">Calm Breath</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.features")}
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.about")}
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.pricing")}
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {user ? (
              <>
                <Button variant="ghost" onClick={handleAuth}>
                  {profile?.has_paid || isAdmin ? t("nav.dashboard") : t("pricing.cta")}
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  {t("common.logout")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  {t("common.login")}
                </Button>
                <Button onClick={() => navigate("/auth?mode=signup")}>
                  {t("nav.getStarted")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
