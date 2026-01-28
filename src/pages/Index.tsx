import { useNavigate } from "react-router-dom";
import { Video, Headphones, BookOpen, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FeatureCard } from "@/components/FeatureCard";
import { PricingCard } from "@/components/PricingCard";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-calm.jpg";

const Index = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Video,
      title: "Vídeos Educativos",
      description: "Aprende técnicas comprovadas para gerir a ansiedade através de vídeos explicativos e práticos.",
    },
    {
      icon: Headphones,
      title: "Áudios Relaxantes",
      description: "Sons calmantes e meditações guiadas para te ajudar a relaxar em momentos de stress.",
    },
    {
      icon: BookOpen,
      title: "Guias de Texto",
      description: "Leituras breves e práticas com dicas simples que podes aplicar no teu dia-a-dia.",
    },
    {
      icon: MessageSquare,
      title: "Feedback",
      description: "Partilha a tua experiência e ajuda-nos a melhorar continuamente os nossos conteúdos.",
    },
    {
      icon: Sparkles,
      title: "Fácil de Usar",
      description: "Interface intuitiva desenhada para que possas focar-te no que realmente importa.",
    },
  ];

  const handleGetStarted = () => {
    if (user) {
      if (profile?.has_paid) {
        navigate("/dashboard");
      } else {
        navigate("/payment");
      }
    } else {
      navigate("/auth?mode=signup");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Respira Fundo.{" "}
              <span className="text-primary">Encontra a Calma.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              O Calm Breath é a tua ferramenta para lidar com a ansiedade. 
              Oferecemos vídeos, áudios relaxantes e guias práticos para te ajudar 
              a encontrar paz no teu dia-a-dia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6" onClick={handleGetStarted}>
                {user ? (profile?.has_paid ? "Ir para Dashboard" : "Completar Pagamento") : "Começar Agora"}
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Saber Mais
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo o que precisas para encontrar a calma
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas pensadas para te ajudar a gerir a ansiedade de forma simples e eficaz.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Porquê o Calm Breath?
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    A ansiedade afeta milhões de pessoas em todo o mundo. 
                    Sabemos como pode ser difícil encontrar ajuda acessível e prática.
                  </p>
                  <p>
                    O Calm Breath nasceu da necessidade de criar uma ferramenta simples, 
                    mas poderosa, que ajude qualquer pessoa a encontrar momentos de paz.
                  </p>
                  <p>
                    Com vídeos educativos, áudios relaxantes e guias práticos, 
                    oferecemos-te um companheiro para os momentos mais difíceis.
                  </p>
                </div>
              </div>
              <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Escolhe o teu conteúdo</h4>
                      <p className="text-sm text-muted-foreground">Vídeo, áudio ou texto</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Pratica regularmente</h4>
                      <p className="text-sm text-muted-foreground">Poucos minutos por dia</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Sente a diferença</h4>
                      <p className="text-sm text-muted-foreground">Mais calma no dia-a-dia</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Começa a tua jornada hoje
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Aproveita o preço promocional e obtém acesso completo a todas as funcionalidades.
            </p>
          </div>
          
          <PricingCard />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
