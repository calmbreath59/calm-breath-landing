import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, {status: 204});
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
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
