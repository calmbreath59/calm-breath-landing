import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CountdownTimer } from "./CountdownTimer";

export const PricingCard = () => {
  const features = [
    "Acesso a todos os vídeos",
    "Áudios relaxantes ilimitados",
    "Guias de texto personalizados",
    "Suporte via email",
    "Atualizações gratuitas",
  ];

  return (
    <Card className="relative overflow-hidden border-primary/30 shadow-xl max-w-md mx-auto">
      {/* Promo badge */}
      <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-sm font-semibold px-4 py-1 rounded-bl-lg">
        Promoção
      </div>
      
      <CardHeader className="text-center pb-2 pt-8">
        <h3 className="text-2xl font-bold text-foreground mb-2">Plano Completo</h3>
        <p className="text-muted-foreground">Acesso total à plataforma</p>
        
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

        <Button className="w-full text-lg py-6" size="lg">
          Começar Agora
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Pagamento único. Sem taxas escondidas.
        </p>
      </CardContent>
    </Card>
  );
};
