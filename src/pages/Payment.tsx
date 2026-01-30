import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { usePayment } from "@/hooks/usePayment";
import { CountdownTimer } from "@/components/CountdownTimer";
import logo from "@/assets/calm-breath-logo.png";
import { useToast } from "@/hooks/use-toast";

const Payment = () => {
  const { t } = useTranslation();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { initiatePayment, verifyPayment, isLoading: paymentLoading } = usePayment();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile?.has_paid) {
      navigate("/dashboard");
    }
  }, [profile, navigate]);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    
    if (paymentStatus === "success" && !hasVerified.current) {
      hasVerified.current = true;
      
      toast({
        title: t("payment.paymentConfirmed"),
        description: t("payment.paymentConfirmedDesc"),
      });
      
      // Verify payment and redirect to dashboard
      const checkAndRedirect = async () => {
        // Wait a bit for Stripe to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        const hasPaid = await verifyPayment();
        if (hasPaid) {
          navigate("/dashboard");
        }
      };
      checkAndRedirect();
    } else if (paymentStatus === "canceled") {
      toast({
        title: t("payment.paymentCanceled"),
        description: t("payment.paymentCanceledDesc"),
        variant: "destructive",
      });
      // Clear the URL params
      navigate("/payment", { replace: true });
    }
  }, [searchParams, verifyPayment, toast, t, navigate]);

  const features = [
    t("pricing.features.allVideos"),
    t("pricing.features.unlimitedAudio"),
    t("pricing.features.textGuides"),
    t("pricing.features.emailSupport"),
    t("pricing.features.freeUpdates"),
  ];

  const handlePayment = () => {
    initiatePayment(user?.email);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md relative overflow-hidden border-primary/30 shadow-xl">
        {/* Promo badge */}
        <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-sm font-semibold px-4 py-1 rounded-bl-lg">
          {t("pricing.promotion")}
        </div>

        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Calm Breath" className="w-16 h-16" />
          </div>
          <CardTitle className="text-2xl">{t("payment.hello")}, {profile?.full_name || user?.email}!</CardTitle>
          <p className="text-muted-foreground mt-2">
            {t("payment.completePayment")}
          </p>

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
            onClick={handlePayment}
            disabled={paymentLoading}
          >
            {paymentLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("payment.processing")}
              </>
            ) : (
              t("payment.payNow")
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t("pricing.oneTime")}
          </p>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("payment.backToHome")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;
