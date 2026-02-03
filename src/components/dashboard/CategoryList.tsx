import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Video, Headphones, BookOpen, Plus, Edit, Trash2, Eye, EyeOff, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/contexts/AuthContext";
import { Category } from "@/types/cms";
import { CategoryFormDialog } from "./CategoryFormDialog";
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

interface CategoryListProps {
  type: "video" | "audio" | "guide";
  onSelectCategory: (category: Category) => void;
}

export const CategoryList = ({ type, onSelectCategory }: CategoryListProps) => {
  const { t, i18n } = useTranslation();
  const { isAdmin } = useAuth();
  const { categories, isLoading, createCategory, updateCategory, deleteCategory, toggleVisibility } =
    useCategories(type);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const getIcon = () => {
    switch (type) {
      case "video":
        return <Video className="w-6 h-6 text-primary" />;
      case "audio":
        return <Headphones className="w-6 h-6 text-primary" />;
      case "guide":
        return <BookOpen className="w-6 h-6 text-primary" />;
    }
  };

  const getTranslatedName = (category: Category) => {
    if (category.name_translations && category.name_translations[i18n.language]) {
      return category.name_translations[i18n.language];
    }
    return category.name;
  };

  const getTranslatedDescription = (category: Category) => {
    if (category.description_translations && category.description_translations[i18n.language]) {
      return category.description_translations[i18n.language];
    }
    return category.description;
  };

  const visibleCategories = isAdmin
    ? categories
    : categories.filter((c) => c.is_visible !== false);

  const handleEdit = (e: React.MouseEvent, category: Category) => {
    e.stopPropagation();
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, category: Category) => {
    e.stopPropagation();
    setDeletingCategory(category);
  };

  const handleToggleVisibility = async (e: React.MouseEvent, category: Category) => {
    e.stopPropagation();
    await toggleVisibility(category.id, !category.is_visible);
  };

  const confirmDelete = async () => {
    if (deletingCategory) {
      await deleteCategory(deletingCategory.id);
      setDeletingCategory(null);
    }
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
    <>
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => { setEditingCategory(null); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            {t("cms.addCategory")}
          </Button>
        </div>
      )}

      {visibleCategories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {t("cms.noCategories")}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {visibleCategories.map((category) => (
            <Card
              key={category.id}
              className={`group hover:shadow-lg transition-shadow cursor-pointer ${
                category.is_visible === false ? "opacity-60" : ""
              }`}
              onClick={() => onSelectCategory(category)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {category.icon ? (
                      <span className="text-2xl">{category.icon}</span>
                    ) : (
                      getIcon()
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleToggleVisibility(e, category)}
                      >
                        {category.is_visible === false ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleEdit(e, category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(e, category)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg mt-2">{getTranslatedName(category)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  {getTranslatedDescription(category) || t("cms.noDescription")}
                </p>
                <Button className="w-full group-hover:bg-primary/90">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  {t("common.view")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CategoryFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        type={type}
        category={editingCategory}
        onSubmit={async (data) => {
          if (editingCategory) {
            await updateCategory(editingCategory.id, data);
          } else {
            await createCategory({ ...data, type });
          }
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
      />

      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cms.deleteCategory")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cms.deleteCategoryConfirm")}
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
