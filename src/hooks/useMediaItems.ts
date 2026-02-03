import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MediaItem, MediaItemFormData } from "@/types/cms";
import { useToast } from "@/hooks/use-toast";

export const useMediaItems = (categoryId?: string) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMediaItems = async () => {
    try {
      let query = supabase
        .from("media_items")
        .select("*")
        .order("sort_order", { ascending: true });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMediaItems((data || []) as MediaItem[]);
    } catch (error) {
      console.error("Error fetching media items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (categoryId) {
      fetchMediaItems();
    } else {
      setIsLoading(false);
    }
  }, [categoryId]);

  const createMediaItem = async (
    categoryId: string,
    formData: MediaItemFormData
  ) => {
    try {
      const { data, error } = await supabase
        .from("media_items")
        .insert({
          category_id: categoryId,
          title: formData.title,
          description: formData.description || null,
          content: formData.content || null,
          type: formData.type,
          file_url: formData.file_url || null,
          thumbnail_url: formData.thumbnail_url || null,
          duration: formData.duration || null,
          read_time: formData.read_time || null,
          is_visible: formData.is_visible,
        })
        .select()
        .single();

      if (error) throw error;

      setMediaItems((prev) => [...prev, data as MediaItem]);
      toast({ title: "Item criado com sucesso!" });
      return data;
    } catch (error) {
      console.error("Error creating media item:", error);
      toast({ title: "Erro ao criar item", variant: "destructive" });
      throw error;
    }
  };

  const updateMediaItem = async (
    id: string,
    formData: Partial<MediaItemFormData>
  ) => {
    try {
      const { data, error } = await supabase
        .from("media_items")
        .update({
          title: formData.title,
          description: formData.description,
          content: formData.content,
          file_url: formData.file_url,
          thumbnail_url: formData.thumbnail_url,
          duration: formData.duration,
          read_time: formData.read_time,
          is_visible: formData.is_visible,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setMediaItems((prev) =>
        prev.map((item) => (item.id === id ? (data as MediaItem) : item))
      );
      toast({ title: "Item atualizado com sucesso!" });
      return data;
    } catch (error) {
      console.error("Error updating media item:", error);
      toast({ title: "Erro ao atualizar item", variant: "destructive" });
      throw error;
    }
  };

  const deleteMediaItem = async (id: string) => {
    try {
      const { error } = await supabase.from("media_items").delete().eq("id", id);

      if (error) throw error;

      setMediaItems((prev) => prev.filter((item) => item.id !== id));
      toast({ title: "Item eliminado com sucesso!" });
    } catch (error) {
      console.error("Error deleting media item:", error);
      toast({ title: "Erro ao eliminar item", variant: "destructive" });
      throw error;
    }
  };

  const toggleVisibility = async (id: string, isVisible: boolean) => {
    try {
      const { error } = await supabase
        .from("media_items")
        .update({ is_visible: isVisible })
        .eq("id", id);

      if (error) throw error;

      setMediaItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_visible: isVisible } : item
        )
      );
    } catch (error) {
      console.error("Error toggling visibility:", error);
      throw error;
    }
  };

  return {
    mediaItems,
    isLoading,
    fetchMediaItems,
    createMediaItem,
    updateMediaItem,
    deleteMediaItem,
    toggleVisibility,
  };
};
