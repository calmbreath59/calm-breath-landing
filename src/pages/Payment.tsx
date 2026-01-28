import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { usePayment } from "@/hooks/usePayment";
import { CountdownTimer } from "@/components/CountdownTimer";
import logo from "@/assets/calm-breath-logo.png";
import { useToast } from "@/hooks/use-toast";

const Payment = () => {
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const { initiatePayment, isLoading: paymentLoading } = usePayment();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

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
    if (paymentStatus === "success") {
      toast({
        title: "Pagamento confirmado!",
        description: "Obrigado pela tua compra. Estamos a verificar...",
      });
      // Refresh profile to check payment status
      const checkPayment = async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refreshProfile();
      };
      checkPayment();
    } else if (paymentStatus === "canceled") {
      toast({
        title: "Pagamento cancelado",
        description: "Podes tentar novamente quando quiseres.",
        variant: "destructive",
      });
    }
  }, [searchParams, refreshProfile, toast]);

  const features = [
    "Acesso a todos os vídeos",
    "Áudios relaxantes ilimitados",
    "Guias de texto personalizados",
    "Suporte via email",
    "Atualizações gratuitas",
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
          Promoção
        </div>

        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Calm Breath" className="w-16 h-16" />
          </div>
          <CardTitle className="text-2xl">Olá, {profile?.full_name || user?.email}!</CardTitle>
          <p className="text-muted-foreground mt-2">
            Completa o pagamento para aceder a todo o conteúdo.
          </p>

          <div className="mt-6">
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl text-muted-foreground line-through">10€</span>
              <span className="text-5xl font-bold text-primary">4€</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Preço promocional</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Oferta termina em:</p>
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
                A processar...
              </>
            ) : (
              "Pagar Agora - 4€"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Pagamento único. Sem taxas escondidas.
          </p>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Voltar à página inicial
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;
