import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CountdownTimer } from "./CountdownTimer";
import { useAuth } from "@/contexts/AuthContext";

export const PricingCard = () => {
  const { t } = useTranslation();
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const features = [
    t("pricing.features.allVideos"),
    t("pricing.features.unlimitedAudio"),
    t("pricing.features.textGuides"),
    t("pricing.features.emailSupport"),
    t("pricing.features.freeUpdates"),
  ];

  const handleClick = () => {
    if (user) {
      if (profile?.has_paid || isAdmin) {
        navigate("/dashboard");
      } else {
        navigate("/payment");
      }
    } else {
      navigate("/auth?mode=signup");
    }
  };

  const getButtonText = () => {
    if (user) {
      if (profile?.has_paid || isAdmin) {
        return t("nav.dashboard");
      }
      return t("pricing.cta");
    }
    return t("hero.cta");
  };

  return (
    <Card className="relative overflow-hidden border-primary/30 shadow-xl max-w-md mx-auto">
      {/* Promo badge */}
      <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-sm font-semibold px-4 py-1 rounded-bl-lg">
        {t("pricing.promotion")}
      </div>
      
      <CardHeader className="text-center pb-2 pt-8">
        <h3 className="text-2xl font-bold text-foreground mb-2">{t("pricing.title")}</h3>
        <p className="text-muted-foreground">{t("pricing.subtitle")}</p>
        
        <div className="mt-6">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl text-muted-foreground line-through">{t("pricing.originalPrice")}</span>
            <span className="text-5xl font-bold text-primary">{t("pricing.currentPrice")}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{t("pricing.promotionalPrice")}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">{t("pricing.offerEnds")}</p>
          <CountdownTimer />
        </div>

        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        <Button 
          className="w-full text-lg py-6" 
          size="lg"
          onClick={handleClick}
        >
          {getButtonText()}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          {t("pricing.oneTime")}
        </p>
      </CardContent>
    </Card>
  );
};
