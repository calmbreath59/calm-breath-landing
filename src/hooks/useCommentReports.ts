import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CommentReport } from "@/types/cms";
import { useToast } from "@/hooks/use-toast";

export const useCommentReports = () => {
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchReports = async () => {
    try {
      const { data: reportsData, error } = await supabase
        .from("comment_reports")
        .select(`
          *,
          comments (
            id,
            content,
            user_id,
            media_item_id,
            is_hidden_by_admin
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get all unique user IDs (reporters and comment authors)
      const reporterIds = (reportsData || []).map((r) => r.reporter_id);
      const commentAuthorIds = (reportsData || [])
        .filter((r) => r.comments)
        .map((r) => r.comments.user_id);
      const allUserIds = [...new Set([...reporterIds, ...commentAuthorIds])];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", allUserIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      const reportsWithProfiles = (reportsData || []).map((report) => {
        const commentData = report.comments as {
          id: string;
          content: string;
          user_id: string;
          media_item_id: string;
          is_hidden_by_admin: boolean;
        } | null;
        
        return {
          id: report.id,
          comment_id: report.comment_id,
          reporter_id: report.reporter_id,
          reason: report.reason,
          status: report.status as CommentReport["status"],
          admin_notes: report.admin_notes,
          reviewed_by: report.reviewed_by,
          reviewed_at: report.reviewed_at,
          created_at: report.created_at,
          reporter: profileMap.get(report.reporter_id) || undefined,
          comment: commentData
            ? {
                id: commentData.id,
                media_item_id: commentData.media_item_id,
                user_id: commentData.user_id,
                content: commentData.content,
                is_visible: true,
                is_hidden_by_admin: commentData.is_hidden_by_admin,
                created_at: report.created_at,
                updated_at: report.created_at,
                profile: profileMap.get(commentData.user_id) || undefined,
              }
            : undefined,
        };
      });

      setReports(reportsWithProfiles as CommentReport[]);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateReportStatus = async (
    id: string,
    status: "reviewed" | "dismissed",
    adminNotes?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("comment_reports")
        .update({
          status,
          admin_notes: adminNotes || null,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setReports((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status, admin_notes: adminNotes || null }
            : r
        )
      );
      toast({ title: "Report atualizado!" });
    } catch (error) {
      console.error("Error updating report:", error);
      toast({ title: "Erro ao atualizar report", variant: "destructive" });
    }
  };

  const hideComment = async (commentId: string, hidden: boolean) => {
    try {
      const { error } = await supabase
        .from("comments")
        .update({ is_hidden_by_admin: hidden })
        .eq("id", commentId);

      if (error) throw error;

      // Refresh reports to update comment status
      await fetchReports();
      toast({ title: hidden ? "Comentário ocultado!" : "Comentário visível!" });
    } catch (error) {
      console.error("Error hiding comment:", error);
      toast({ title: "Erro ao ocultar comentário", variant: "destructive" });
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      // Remove reports for deleted comment
      setReports((prev) => prev.filter((r) => r.comment_id !== commentId));
      toast({ title: "Comentário eliminado!" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({ title: "Erro ao eliminar comentário", variant: "destructive" });
    }
  };

  return {
    reports,
    isLoading,
    fetchReports,
    updateReportStatus,
    hideComment,
    deleteComment,
  };
};
