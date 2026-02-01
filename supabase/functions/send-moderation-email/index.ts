import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { email, type, reason } = await req.json();
    // Chamada para o endpoint Node/backend (ver src/backendEmail.ts)
    await fetch(Deno.env.get('EMAIL_HTTP_ENDPOINT'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: type === 'ban' ? 'Account Banned - Calm Breath' : 'Your Comment Was Moderated - Calm Breath',
        html: type === 'ban'
          ? `<h2>You have been banned.</h2><p>Reason: ${reason}</p><p>If you feel this was a mistake, reply to this email with your request for unban.</p>`
          : `<h2>Your comment was removed or hidden by an admin.</h2><p>Reason: ${reason}</p>`
      })
    });
    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500 
    });
  }
});
