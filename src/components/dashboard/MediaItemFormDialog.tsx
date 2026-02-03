import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { Upload, Loader2 } from "lucide-react";
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
import { MediaItem, MediaItemFormData } from "@/types/cms";
import { useFileUpload } from "@/hooks/useFileUpload";

interface MediaItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "video" | "audio" | "guide";
  item?: MediaItem | null;
  onSubmit: (data: MediaItemFormData) => Promise<void>;
}

export const MediaItemFormDialog = ({
  open,
  onOpenChange,
  type,
  item,
  onSubmit,
}: MediaItemFormDialogProps) => {
  const { t } = useTranslation();
  const { uploadFile, isUploading } = useFileUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm<MediaItemFormData>({
    defaultValues: {
      title: "",
      description: "",
      content: "",
      file_url: "",
      thumbnail_url: "",
      duration: "",
      read_time: "",
      is_visible: true,
      type,
    },
  });

  const isVisible = watch("is_visible");
  const fileUrl = watch("file_url");

  useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        description: item.description || "",
        content: item.content || "",
        file_url: item.file_url || "",
        thumbnail_url: item.thumbnail_url || "",
        duration: item.duration || "",
        read_time: item.read_time || "",
        is_visible: item.is_visible !== false,
        type: item.type,
      });
    } else {
      reset({
        title: "",
        description: "",
        content: "",
        file_url: "",
        thumbnail_url: "",
        duration: "",
        read_time: "",
        is_visible: true,
        type,
      });
    }
  }, [item, type, reset]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "file_url" | "thumbnail_url") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const folder = field === "file_url" ? type + "s" : "thumbnails";
    const url = await uploadFile(file, folder);
    if (url) {
      setValue(field, url);
    }
  };

  const handleFormSubmit = async (data: MediaItemFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? t("cms.editItem") : t("cms.addItem")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("common.title")} *</Label>
            <Input
              id="title"
              {...register("title", { required: true })}
              placeholder={t("cms.itemTitlePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("common.description")}</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={t("cms.itemDescriptionPlaceholder")}
            />
          </div>

          {type === "guide" && (
            <div className="space-y-2">
              <Label htmlFor="content">{t("cms.content")}</Label>
              <Textarea
                id="content"
                {...register("content")}
                placeholder={t("cms.contentPlaceholder")}
                rows={6}
              />
            </div>
          )}

          {(type === "video" || type === "audio") && (
            <div className="space-y-2">
              <Label>{t("cms.file")}</Label>
              <div className="flex gap-2">
                <Input
                  {...register("file_url")}
                  placeholder={t("cms.fileUrlPlaceholder")}
                  className="flex-1"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept={type === "video" ? "video/*" : "audio/*"}
                    onChange={(e) => handleFileUpload(e, "file_url")}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" asChild disabled={isUploading}>
                    <span>
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </span>
                  </Button>
                </label>
              </div>
              {fileUrl && (
                <p className="text-xs text-muted-foreground truncate">
                  {fileUrl}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("cms.thumbnail")}</Label>
            <div className="flex gap-2">
              <Input
                {...register("thumbnail_url")}
                placeholder={t("cms.thumbnailPlaceholder")}
                className="flex-1"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "thumbnail_url")}
                  className="hidden"
                />
                <Button type="button" variant="outline" asChild disabled={isUploading}>
                  <span>
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {type !== "guide" ? (
            <div className="space-y-2">
              <Label htmlFor="duration">{t("cms.duration")}</Label>
              <Input
                id="duration"
                {...register("duration")}
                placeholder="12:34"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="read_time">{t("cms.readTime")}</Label>
              <Input
                id="read_time"
                {...register("read_time")}
                placeholder="5 min"
              />
            </div>
          )}

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
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {item ? t("common.save") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
