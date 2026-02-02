import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-supabase-client-name, x-supabase-client-version, accept, accept-language, content-language",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Max-Age": "86400",
};

interface ModerationEmailRequest {
  email: string;
  type: "ban" | "comment";
  reason?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, reason }: ModerationEmailRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const subject = type === "ban" 
      ? "Account Banned - Calm Breath" 
      : "Your Comment Was Moderated - Calm Breath";

    const html = type === "ban"
      ? `<h2>Your account has been banned.</h2><p>Reason: ${reason || "No reason provided"}</p><p>If you believe this was a mistake, please reply to this email to request a review.</p>`
      : `<h2>Your comment was removed or hidden by an administrator.</h2><p>Reason: ${reason || "No reason provided"}</p>`;

    const emailResponse = await resend.emails.send({
      from: "Calm Breath <noreply@calmbreath.app>", // Replace with your verified domain
      to: [email],
      subject,
      html,
    });

    console.log("Moderation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (e: any) {
    console.error("Error sending moderation email:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
