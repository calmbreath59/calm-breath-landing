import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Video, Headphones, BookOpen, Play, LogOut, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import logo from "@/assets/calm-breath-logo.png";

const Dashboard = () => {
  const { t } = useTranslation();
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
      titleKey: "dashboard.content.videos.breathing.title",
      descriptionKey: "dashboard.content.videos.breathing.description",
      duration: "12:34",
      thumbnail: "🧘",
    },
    {
      id: 2,
      titleKey: "dashboard.content.videos.meditation.title",
      descriptionKey: "dashboard.content.videos.meditation.description",
      duration: "15:00",
      thumbnail: "🧠",
    },
    {
      id: 3,
      titleKey: "dashboard.content.videos.panic.title",
      descriptionKey: "dashboard.content.videos.panic.description",
      duration: "18:22",
      thumbnail: "💪",
    },
    {
      id: 4,
      titleKey: "dashboard.content.videos.grounding.title",
      descriptionKey: "dashboard.content.videos.grounding.description",
      duration: "10:15",
      thumbnail: "🌱",
    },
  ];

  const audios = [
    {
      id: 1,
      titleKey: "dashboard.content.audio.forest.title",
      descriptionKey: "dashboard.content.audio.forest.description",
      duration: "30:00",
    },
    {
      id: 2,
      titleKey: "dashboard.content.audio.sleep.title",
      descriptionKey: "dashboard.content.audio.sleep.description",
      duration: "25:00",
    },
    {
      id: 3,
      titleKey: "dashboard.content.audio.ambient.title",
      descriptionKey: "dashboard.content.audio.ambient.description",
      duration: "45:00",
    },
    {
      id: 4,
      titleKey: "dashboard.content.audio.breathing478.title",
      descriptionKey: "dashboard.content.audio.breathing478.description",
      duration: "10:00",
    },
  ];

  const guides = [
    {
      id: 1,
      titleKey: "dashboard.content.guides.morning.title",
      descriptionKey: "dashboard.content.guides.morning.description",
      readTime: "3 min",
    },
    {
      id: 2,
      titleKey: "dashboard.content.guides.triggers.title",
      descriptionKey: "dashboard.content.guides.triggers.description",
      readTime: "5 min",
    },
    {
      id: 3,
      titleKey: "dashboard.content.guides.gratitude.title",
      descriptionKey: "dashboard.content.guides.gratitude.description",
      readTime: "4 min",
    },
    {
      id: 4,
      titleKey: "dashboard.content.guides.nutrition.title",
      descriptionKey: "dashboard.content.guides.nutrition.description",
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
              <LanguageSwitcher />
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                <Settings className="w-4 h-4" />
              </Button>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                  <Shield className="w-4 h-4 mr-2" />
                  {t("nav.admin")}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                {t("common.logout")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("dashboard.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("dashboard.welcome")}, {profile?.full_name || profile?.email}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                {t("dashboard.tabs.videos")}
              </TabsTrigger>
              <TabsTrigger value="audios" className="flex items-center gap-2">
                <Headphones className="w-4 h-4" />
                {t("dashboard.tabs.audio")}
              </TabsTrigger>
              <TabsTrigger value="guides" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {t("dashboard.tabs.guides")}
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
                      <CardTitle className="text-lg">{t(video.titleKey)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">{t(video.descriptionKey)}</p>
                      <Button className="w-full group-hover:bg-primary/90">
                        <Play className="w-4 h-4 mr-2" />
                        {t("dashboard.tabs.videos")}
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
                      <CardTitle className="text-lg mt-2">{t(audio.titleKey)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">{t(audio.descriptionKey)}</p>
                      <Button className="w-full group-hover:bg-primary/90">
                        <Play className="w-4 h-4 mr-2" />
                        {t("dashboard.tabs.audio")}
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
                      <CardTitle className="text-lg mt-2">{t(guide.titleKey)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">{t(guide.descriptionKey)}</p>
                      <Button className="w-full group-hover:bg-primary/90">
                        <BookOpen className="w-4 h-4 mr-2" />
                        {t("dashboard.tabs.guides")}
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
