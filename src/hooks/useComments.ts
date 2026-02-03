import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "@/types/cms";
import { useToast } from "@/hooks/use-toast";

export const useComments = (mediaItemId?: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchComments = async () => {
    if (!mediaItemId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select("*")
        .eq("media_item_id", mediaItemId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each comment
      const userIds = [...new Set((commentsData || []).map((c) => c.user_id))];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(
          (profiles || []).map((p) => [p.user_id, p])
        );

        const commentsWithProfiles = (commentsData || []).map((comment) => ({
          ...comment,
          profile: profileMap.get(comment.user_id) || null,
        }));

        setComments(commentsWithProfiles as Comment[]);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [mediaItemId]);

  const createComment = async (content: string, userId: string) => {
    if (!mediaItemId) return;

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          media_item_id: mediaItemId,
          user_id: userId,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch the profile for the new comment
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .eq("user_id", userId)
        .single();

      const newComment = {
        ...data,
        profile: profile || null,
      } as Comment;

      setComments((prev) => [newComment, ...prev]);
      toast({ title: "Comentário adicionado!" });
      return data;
    } catch (error) {
      console.error("Error creating comment:", error);
      toast({ title: "Erro ao adicionar comentário", variant: "destructive" });
      throw error;
    }
  };

  const updateComment = async (id: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .update({ content })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === id ? { ...comment, content: data.content } : comment
        )
      );
      toast({ title: "Comentário atualizado!" });
      return data;
    } catch (error) {
      console.error("Error updating comment:", error);
      toast({ title: "Erro ao atualizar comentário", variant: "destructive" });
      throw error;
    }
  };

  const deleteComment = async (id: string) => {
    try {
      const { error } = await supabase.from("comments").delete().eq("id", id);

      if (error) throw error;

      setComments((prev) => prev.filter((comment) => comment.id !== id));
      toast({ title: "Comentário eliminado!" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({ title: "Erro ao eliminar comentário", variant: "destructive" });
      throw error;
    }
  };

  const hideComment = async (id: string, hidden: boolean) => {
    try {
      const { error } = await supabase
        .from("comments")
        .update({ is_hidden_by_admin: hidden })
        .eq("id", id);

      if (error) throw error;

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === id ? { ...comment, is_hidden_by_admin: hidden } : comment
        )
      );
      toast({ title: hidden ? "Comentário ocultado!" : "Comentário visível!" });
    } catch (error) {
      console.error("Error hiding comment:", error);
      throw error;
    }
  };

  const reportComment = async (commentId: string, reporterId: string, reason: string) => {
    try {
      const { error } = await supabase.from("comment_reports").insert({
        comment_id: commentId,
        reporter_id: reporterId,
        reason,
      });

      if (error) throw error;

      toast({ title: "Comentário reportado!" });
    } catch (error) {
      console.error("Error reporting comment:", error);
      toast({ title: "Erro ao reportar comentário", variant: "destructive" });
      throw error;
    }
  };

  return {
    comments,
    isLoading,
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
    hideComment,
    reportComment,
  };
};
