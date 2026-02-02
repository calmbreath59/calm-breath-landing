import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Video, Headphones, BookOpen, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FeatureCard } from "@/components/FeatureCard";
import { PricingCard } from "@/components/PricingCard";
import { FeedbackButton } from "@/components/FeedbackButton";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-calm.jpg";

const Index = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Video,
      title: t("features.videos.title"),
      description: t("features.videos.description"),
    },
    {
      icon: Headphones,
      title: t("features.audio.title"),
      description: t("features.audio.description"),
    },
    {
      icon: BookOpen,
      title: t("features.guides.title"),
      description: t("features.guides.description"),
    },
    {
      icon: MessageSquare,
      title: "Feedback",
      description: t("features.progress.description"),
    },
    {
      icon: Sparkles,
      title: t("features.progress.title"),
      description: t("features.progress.description"),
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

  const getButtonText = () => {
    if (user) {
      if (profile?.has_paid) {
        return t("nav.dashboard");
      }
      return t("pricing.cta");
    }
    return t("hero.cta");
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
              {t("hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6" onClick={handleGetStarted}>
                {getButtonText()}
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                {t("hero.learnMore")}
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
              {t("features.subtitle")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("features.subtitle")}
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
                  {t("hero.title")}
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>{t("hero.subtitle")}</p>
                </div>
              </div>
              <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t("features.videos.title")}</h4>
                      <p className="text-sm text-muted-foreground">{t("features.videos.description")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t("features.audio.title")}</h4>
                      <p className="text-sm text-muted-foreground">{t("features.audio.description")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t("features.guides.title")}</h4>
                      <p className="text-sm text-muted-foreground">{t("features.guides.description")}</p>
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
              {t("pricing.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("pricing.subtitle")}
            </p>
          </div>
          
          <PricingCard />
        </div>
      </section>

      <Footer />
      <FeedbackButton />
    </div>
  );
};

export default Index;
