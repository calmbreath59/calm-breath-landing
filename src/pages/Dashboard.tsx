import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Headphones, BookOpen, Play, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/calm-breath-logo.png";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("videos");
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const videos = [
    {
      id: 1,
      title: "Técnicas de Respiração para Ansiedade",
      description: "Aprende técnicas de respiração que ajudam a acalmar em momentos de stress.",
      duration: "12:34",
      thumbnail: "🧘",
    },
    {
      id: 2,
      title: "Meditação Guiada para Iniciantes",
      description: "Uma meditação suave para quem está a começar a praticar mindfulness.",
      duration: "15:00",
      thumbnail: "🧠",
    },
    {
      id: 3,
      title: "Como Gerir Ataques de Pânico",
      description: "Estratégias práticas para lidar com ataques de pânico quando acontecem.",
      duration: "18:22",
      thumbnail: "💪",
    },
    {
      id: 4,
      title: "Exercícios de Grounding",
      description: "Técnicas para te ancorar ao presente e reduzir a ansiedade.",
      duration: "10:15",
      thumbnail: "🌱",
    },
  ];

  const audios = [
    {
      id: 1,
      title: "Sons da Natureza - Floresta",
      description: "Sons relaxantes de uma floresta tranquila.",
      duration: "30:00",
    },
    {
      id: 2,
      title: "Meditação para Dormir",
      description: "Áudio guiado para te ajudar a adormecer.",
      duration: "25:00",
    },
    {
      id: 3,
      title: "Música Ambiente Calma",
      description: "Música suave para relaxar durante o dia.",
      duration: "45:00",
    },
    {
      id: 4,
      title: "Respiração 4-7-8",
      description: "Exercício de respiração guiado para acalmar.",
      duration: "10:00",
    },
  ];

  const guides = [
    {
      id: 1,
      title: "5 Dicas para Começar o Dia Sem Ansiedade",
      description: "Rotinas matinais que ajudam a começar o dia com calma.",
      readTime: "3 min",
    },
    {
      id: 2,
      title: "Como Identificar os Gatilhos da Ansiedade",
      description: "Aprende a reconhecer o que desencadeia a tua ansiedade.",
      readTime: "5 min",
    },
    {
      id: 3,
      title: "Técnica do Diário de Gratidão",
      description: "Como usar a gratidão para melhorar o bem-estar mental.",
      readTime: "4 min",
    },
    {
      id: 4,
      title: "Alimentação e Ansiedade",
      description: "Como a alimentação pode influenciar os níveis de ansiedade.",
      readTime: "6 min",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Calm Breath" className="w-10 h-10" />
              <span className="text-xl font-bold text-foreground">Calm Breath</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {profile?.full_name || profile?.email}
              </span>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bem-vindo ao teu espaço de calma
            </h1>
            <p className="text-muted-foreground">
              Explora os nossos vídeos, áudios e guias para encontrar a paz interior.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Vídeos
              </TabsTrigger>
              <TabsTrigger value="audios" className="flex items-center gap-2">
                <Headphones className="w-4 h-4" />
                Áudios
              </TabsTrigger>
              <TabsTrigger value="guides" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Guias
              </TabsTrigger>
            </TabsList>

            <TabsContent value="videos">
              <div className="grid md:grid-cols-2 gap-6">
                {videos.map((video) => (
                  <Card key={video.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="text-4xl mb-2">{video.thumbnail}</div>
                        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                          {video.duration}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{video.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">{video.description}</p>
                      <Button className="w-full group-hover:bg-primary/90">
                        <Play className="w-4 h-4 mr-2" />
                        Ver Vídeo
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="audios">
              <div className="grid md:grid-cols-2 gap-6">
                {audios.map((audio) => (
                  <Card key={audio.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Headphones className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                          {audio.duration}
                        </span>
                      </div>
                      <CardTitle className="text-lg mt-2">{audio.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">{audio.description}</p>
                      <Button className="w-full group-hover:bg-primary/90">
                        <Play className="w-4 h-4 mr-2" />
                        Ouvir Áudio
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="guides">
              <div className="grid md:grid-cols-2 gap-6">
                {guides.map((guide) => (
                  <Card key={guide.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                          {guide.readTime}
                        </span>
                      </div>
                      <CardTitle className="text-lg mt-2">{guide.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">{guide.description}</p>
                      <Button className="w-full group-hover:bg-primary/90">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Ler Guia
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
