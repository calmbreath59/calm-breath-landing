import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Category, CategoryFormData } from "@/types/cms";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "video" | "audio" | "guide";
  category?: Category | null;
  onSubmit: (data: CategoryFormData) => Promise<void>;
}

export const CategoryFormDialog = ({
  open,
  onOpenChange,
  type,
  category,
  onSubmit,
}: CategoryFormDialogProps) => {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, setValue, watch } = useForm<CategoryFormData>({
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      is_visible: true,
      type,
    },
  });

  const isVisible = watch("is_visible");

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description || "",
        icon: category.icon || "",
        is_visible: category.is_visible !== false,
        type: category.type,
      });
    } else {
      reset({
        name: "",
        description: "",
        icon: "",
        is_visible: true,
        type,
      });
    }
  }, [category, type, reset]);

  const handleFormSubmit = async (data: CategoryFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? t("cms.editCategory") : t("cms.addCategory")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("common.name")} *</Label>
            <Input
              id="name"
              {...register("name", { required: true })}
              placeholder={t("cms.categoryNamePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("common.description")}</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={t("cms.categoryDescriptionPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">{t("cms.icon")}</Label>
            <Input
              id="icon"
              {...register("icon")}
              placeholder="🧘"
            />
            <p className="text-xs text-muted-foreground">
              {t("cms.iconHint")}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_visible">{t("cms.visible")}</Label>
            <Switch
              id="is_visible"
              checked={isVisible}
              onCheckedChange={(checked) => setValue("is_visible", checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">
              {category ? t("common.save") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
