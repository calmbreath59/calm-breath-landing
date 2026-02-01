import { supabase } from "@/integrations/supabase/client";

export async function hideComment(commentId: string, adminId: string, reason?: string) {
  // Esconde comentário e dispara email
  const { data, error } = await supabase
    .from("comments")
    .update({ is_hidden: true, hidden_at: new Date().toISOString(), hidden_by: adminId, hide_reason: reason })
    .eq("id", commentId)
    .select("*, user: user_id(email)").single();

  if (error) throw error;

  // Envio de email
  if (data?.user?.email) {
    await fetch("/api/send-comment-moderation-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.user.email, reason }),
    });
  }
  return data;
}
