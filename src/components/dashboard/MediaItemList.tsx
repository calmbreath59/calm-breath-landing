import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Video, Headphones, BookOpen, Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMediaItems } from "@/hooks/useMediaItems";
import { useAuth } from "@/contexts/AuthContext";
import { Category, MediaItem } from "@/types/cms";
import { MediaItemFormDialog } from "./MediaItemFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MediaItemListProps {
  category: Category;
  onBack: () => void;
  onSelectItem: (item: MediaItem) => void;
}

export const MediaItemList = ({ category, onBack, onSelectItem }: MediaItemListProps) => {
  const { t, i18n } = useTranslation();
  const { isAdmin } = useAuth();
  const { mediaItems, isLoading, createMediaItem, updateMediaItem, deleteMediaItem, toggleVisibility } =
    useMediaItems(category.id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MediaItem | null>(null);

  const getIcon = () => {
    switch (category.type) {
      case "video":
        return <Video className="w-6 h-6 text-primary" />;
      case "audio":
        return <Headphones className="w-6 h-6 text-primary" />;
      case "guide":
        return <BookOpen className="w-6 h-6 text-primary" />;
    }
  };

  const getTranslatedTitle = (item: MediaItem) => {
    if (item.title_translations && item.title_translations[i18n.language]) {
      return item.title_translations[i18n.language];
    }
    return item.title;
  };

  const getTranslatedDescription = (item: MediaItem) => {
    if (item.description_translations && item.description_translations[i18n.language]) {
      return item.description_translations[i18n.language];
    }
    return item.description;
  };

  const visibleItems = isAdmin
    ? mediaItems
    : mediaItems.filter((item) => item.is_visible !== false);

  const handleEdit = (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    setDeletingItem(item);
  };

  const handleToggleVisibility = async (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    await toggleVisibility(item.id, !item.is_visible);
  };

  const confirmDelete = async () => {
    if (deletingItem) {
      await deleteMediaItem(deletingItem.id);
      setDeletingItem(null);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("common.back")}
        </Button>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-12 w-12 bg-muted rounded-full" />
                <div className="h-6 w-3/4 bg-muted rounded mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded mb-4" />
                <div className="h-10 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("common.back")}
        </Button>
        {isAdmin && (
          <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            {t("cms.addItem")}
          </Button>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-4">{category.name}</h2>

      {visibleItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {t("cms.noItems")}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {visibleItems.map((item) => (
            <Card
              key={item.id}
              className={`group hover:shadow-lg transition-shadow cursor-pointer ${
                item.is_visible === false ? "opacity-60" : ""
              }`}
              onClick={() => onSelectItem(item)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {getIcon()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                      {item.duration || item.read_time || "—"}
                    </span>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleToggleVisibility(e, item)}
                        >
                          {item.is_visible === false ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleEdit(e, item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(e, item)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg mt-2">{getTranslatedTitle(item)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {getTranslatedDescription(item) || t("cms.noDescription")}
                </p>
                <Button className="w-full group-hover:bg-primary/90">
                  <Play className="w-4 h-4 mr-2" />
                  {category.type === "guide" ? t("common.read") : t("common.play")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MediaItemFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        type={category.type}
        item={editingItem}
        onSubmit={async (data) => {
          if (editingItem) {
            await updateMediaItem(editingItem.id, data);
          } else {
            await createMediaItem(category.id, { ...data, type: category.type });
          }
          setIsFormOpen(false);
          setEditingItem(null);
        }}
      />

      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cms.deleteItem")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cms.deleteItemConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
