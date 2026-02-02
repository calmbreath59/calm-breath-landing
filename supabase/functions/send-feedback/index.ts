import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FeedbackRequest {
  type: "problem" | "result" | "suggestion";
  message: string;
  email?: string;
  userName?: string;
  userId?: string;
}

const typeLabels = {
  problem: "🐛 Problem Report",
  result: "✨ Result/Success",
  suggestion: "💡 Suggestion",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, message, email, userName, userId }: FeedbackRequest = await req.json();

    if (!message || !type) {
      throw new Error("Missing required fields");
    }

    const emailResponse = await resend.emails.send({
      from: "Calm Breath Feedback <noreply@calmbreath.app>",
      to: ["feedback@calmbreath.app"], // Change to your admin email
      subject: `${typeLabels[type]} from ${userName || "Anonymous"}`,
      html: `
        <h2>${typeLabels[type]}</h2>
        <p><strong>From:</strong> ${userName || "Anonymous"}</p>
        <p><strong>Email:</strong> ${email || "Not provided"}</p>
        <p><strong>User ID:</strong> ${userId || "Not logged in"}</p>
        <hr />
        <h3>Message:</h3>
        <p style="white-space: pre-wrap;">${message}</p>
        <hr />
        <p><small>Sent at: ${new Date().toISOString()}</small></p>
      `,
    });

    console.log("Feedback email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending feedback:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
