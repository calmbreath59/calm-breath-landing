import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Video, Headphones, BookOpen, LogOut, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { CategoryList } from "@/components/dashboard/CategoryList";
import { MediaItemList } from "@/components/dashboard/MediaItemList";
import { MediaItemViewer } from "@/components/dashboard/MediaItemViewer";
import { Category, MediaItem } from "@/types/cms";
import logo from "@/assets/calm-breath-logo.png";

const Dashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"video" | "audio" | "guide">("video");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "video" | "audio" | "guide");
    setSelectedCategory(null);
    setSelectedItem(null);
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setSelectedItem(null);
  };

  const handleSelectItem = (item: MediaItem) => {
    setSelectedItem(item);
  };

  const handleBackFromItems = () => {
    setSelectedCategory(null);
  };

  const handleBackFromViewer = () => {
    setSelectedItem(null);
  };

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
              <NotificationBell />
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

          {/* Show viewer if item is selected */}
          {selectedItem ? (
            <MediaItemViewer item={selectedItem} onBack={handleBackFromViewer} />
          ) : selectedCategory ? (
            /* Show items list if category is selected */
            <MediaItemList
              category={selectedCategory}
              onBack={handleBackFromItems}
              onSelectItem={handleSelectItem}
            />
          ) : (
            /* Show categories tabs */
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  {t("dashboard.tabs.videos")}
                </TabsTrigger>
                <TabsTrigger value="audio" className="flex items-center gap-2">
                  <Headphones className="w-4 h-4" />
                  {t("dashboard.tabs.audio")}
                </TabsTrigger>
                <TabsTrigger value="guide" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {t("dashboard.tabs.guides")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="video">
                <CategoryList type="video" onSelectCategory={handleSelectCategory} />
              </TabsContent>

              <TabsContent value="audio">
                <CategoryList type="audio" onSelectCategory={handleSelectCategory} />
              </TabsContent>

              <TabsContent value="guide">
                <CategoryList type="guide" onSelectCategory={handleSelectCategory} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
