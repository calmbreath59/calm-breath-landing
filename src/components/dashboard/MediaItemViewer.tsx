import { useTranslation } from "react-i18next";
import { ArrowLeft, Video, Headphones, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MediaItem } from "@/types/cms";
import { CommentSection } from "./CommentSection";

interface MediaItemViewerProps {
  item: MediaItem;
  onBack: () => void;
}

export const MediaItemViewer = ({ item, onBack }: MediaItemViewerProps) => {
  const { t, i18n } = useTranslation();

  const getTranslatedTitle = () => {
    if (item.title_translations && item.title_translations[i18n.language]) {
      return item.title_translations[i18n.language];
    }
    return item.title;
  };

  const getTranslatedDescription = () => {
    if (item.description_translations && item.description_translations[i18n.language]) {
      return item.description_translations[i18n.language];
    }
    return item.description;
  };

  const getTranslatedContent = () => {
    if (item.content_translations && item.content_translations[i18n.language]) {
      return item.content_translations[i18n.language];
    }
    return item.content;
  };

  const getIcon = () => {
    switch (item.type) {
      case "video":
        return <Video className="w-8 h-8 text-primary" />;
      case "audio":
        return <Headphones className="w-8 h-8 text-primary" />;
      case "guide":
        return <BookOpen className="w-8 h-8 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("common.back")}
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{getTranslatedTitle()}</CardTitle>
              {getTranslatedDescription() && (
                <p className="text-muted-foreground mt-2">{getTranslatedDescription()}</p>
              )}
              <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                {item.duration && <span>{t("cms.duration")}: {item.duration}</span>}
                {item.read_time && <span>{t("cms.readTime")}: {item.read_time}</span>}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Video/Audio Player - Download disabled */}
          {item.type === "video" && item.file_url && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-6">
              <video
                src={item.file_url}
                controls
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {item.type === "audio" && item.file_url && (
            <div className="bg-muted rounded-lg p-6 mb-6">
              <audio 
                src={item.file_url} 
                controls 
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                className="w-full" 
              />
            </div>
          )}

          {/* Guide Content - Selection/Copy disabled */}
          {item.type === "guide" && getTranslatedContent() && (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none mb-6 select-none"
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div className="whitespace-pre-wrap">{getTranslatedContent()}</div>
            </div>
          )}

          {/* Placeholder if no content */}
          {!item.file_url && item.type !== "guide" && (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-6">
              <div className="text-center text-muted-foreground">
                {getIcon()}
                <p className="mt-2">{t("cms.noContent")}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Comments Section */}
      <CommentSection mediaItemId={item.id} />
    </div>
  );
};
