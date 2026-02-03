import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Category, CategoryFormData } from "@/types/cms";
import { useToast } from "@/hooks/use-toast";

export const useCategories = (type?: "video" | "audio" | "guide") => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      let query = supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCategories((data || []) as Category[]);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [type]);

  const createCategory = async (formData: CategoryFormData) => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: formData.name,
          description: formData.description || null,
          type: formData.type,
          icon: formData.icon || null,
          is_visible: formData.is_visible,
        })
        .select()
        .single();

      if (error) throw error;

      setCategories((prev) => [...prev, data as Category]);
      toast({ title: "Categoria criada com sucesso!" });
      return data;
    } catch (error) {
      console.error("Error creating category:", error);
      toast({ title: "Erro ao criar categoria", variant: "destructive" });
      throw error;
    }
  };

  const updateCategory = async (id: string, formData: Partial<CategoryFormData>) => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .update({
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          is_visible: formData.is_visible,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? (data as Category) : cat))
      );
      toast({ title: "Categoria atualizada com sucesso!" });
      return data;
    } catch (error) {
      console.error("Error updating category:", error);
      toast({ title: "Erro ao atualizar categoria", variant: "destructive" });
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);

      if (error) throw error;

      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      toast({ title: "Categoria eliminada com sucesso!" });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({ title: "Erro ao eliminar categoria", variant: "destructive" });
      throw error;
    }
  };

  const toggleVisibility = async (id: string, isVisible: boolean) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update({ is_visible: isVisible })
        .eq("id", id);

      if (error) throw error;

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id ? { ...cat, is_visible: isVisible } : cat
        )
      );
    } catch (error) {
      console.error("Error toggling visibility:", error);
      throw error;
    }
  };

  return {
    categories,
    isLoading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleVisibility,
  };
};
