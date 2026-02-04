import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export interface Feedback {
  id: string;
  user_id: string | null;
  email: string | null;
  user_name: string | null;
  type: "problem" | "result" | "suggestion";
  message: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface FeedbackFilters {
  userId?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const useFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchFeedbacks = useCallback(async (filters?: FeedbackFilters) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.userId) {
        query = query.eq("user_id", filters.userId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.type) {
        query = query.eq("type", filters.type);
      }
      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo + "T23:59:59");
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeedbacks((data as Feedback[]) || []);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      toast({
        title: t("common.error"),
        description: t("adminFeedbacks.fetchError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  const updateFeedback = async (
    id: string,
    updates: Partial<Pick<Feedback, "status" | "admin_notes">>
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("feedbacks")
        .update({
          ...updates,
          reviewed_by: userData.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                ...updates,
                reviewed_by: userData.user?.id || null,
                reviewed_at: new Date().toISOString(),
              }
            : f
        )
      );

      toast({
        title: t("common.success"),
        description: t("adminFeedbacks.updated"),
      });
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast({
        title: t("common.error"),
        description: t("adminFeedbacks.updateError"),
        variant: "destructive",
      });
    }
  };

  const deleteFeedback = async (id: string) => {
    try {
      const { error } = await supabase.from("feedbacks").delete().eq("id", id);

      if (error) throw error;

      setFeedbacks((prev) => prev.filter((f) => f.id !== id));

      toast({
        title: t("common.success"),
        description: t("adminFeedbacks.deleted"),
      });
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast({
        title: t("common.error"),
        description: t("adminFeedbacks.deleteError"),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  return {
    feedbacks,
    isLoading,
    fetchFeedbacks,
    updateFeedback,
    deleteFeedback,
  };
};
