import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { encode as encodeHex } from "https://deno.land/std@0.190.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email: string;
  user_id: string;
  full_name?: string;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  const hashHex = new TextDecoder().decode(encodeHex(hashArray));
  return hashHex;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { email, user_id, full_name }: VerificationRequest = await req.json();

    if (!email || !user_id) {
      throw new Error("email and user_id are required");
    }

    // Cooldown: block resend if sent <5min. (Mem only: real prod usar Redis/PG)
    const cooldownRes = await fetch(Deno.env.get("EMAIL_HTTP_COOLDOWN")!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const cooldownData = await cooldownRes.json();
    if (!cooldownData.canSend) {
      return new Response(JSON.stringify({ success: false, error: `Por favor aguarde mais ${cooldownData.next}s antes de pedir novo email.`}), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }
    // Generate 6-digit code and hash it
    const code = generateCode();
    const hashedCode = await hashCode(code);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing codes for this user
    await adminClient
      .from("email_verification_codes")
      .delete()
      .eq("user_id", user_id);

    // Insert hashed code (NOT plaintext)
    const { error: insertError } = await adminClient
      .from("email_verification_codes")
      .insert({
        user_id,
        code: hashedCode, // Store hashed code
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error inserting code:", insertError);
      throw new Error("Failed to create verification code");
    }

    // Check if Resend API key is configured
    // ============ ENV ============
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const smtpFrom = Deno.env.get("SMTP_FROM") || smtpUser;
    if (!smtpUser || !smtpPass) {
      throw new Error("SMTP credentials missing (SMTP_USER, SMTP_PASS)");
    }

    // ============ SMTP (Deno) ============
    const smtpConnect = async (opts: {hostname: string, port: number, username: string, password: string, from: string, to: string, subject: string, content: string}) => {
      // Light SMTP client (Deno), compatible with Gmail App Passwords.
      // Minimalist: RFC5321 + simple HTML MIME. Gmail SMTP: smtp.gmail.com:465 (SSL),
      // which isn't natively supported by fetch but is by SMTP libraries in node. In Deno, use plain TCP (unsecure for POC only).
      // For prod, send via REST endpoint (proxy) or compatible mail server.
      // This example is a placeholder for your real backend to deliver via SMTP.
      // (No production-ready SMTP for Deno official yet.)
      console.log(`[MOCK] Email sent to ${opts.to} with code ${code}`);
      // In real deployment, use a backend NodeJS endpoint that wraps nodemailer.
      return true;
    };

    await smtpConnect({
      hostname: "smtp.gmail.com",
      port: 465, // SSL
      username: smtpUser,
      password: smtpPass,
      from: smtpFrom,
      to: email,
      subject: "Verify your email - Calm Breath",
      content: `<!DOCTYPE html><html><head><style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; } .container { max-width: 600px; margin: 0 auto; padding: 20px; } .header { text-align: center; margin-bottom: 30px; } .code { font-size: 32px; font-weight: bold; text-align: center; background: #f5f5f5; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0; } .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }</style></head><body><div class="container"><div class="header"><h1>🧘 Calm Breath</h1></div><p>Hello${full_name ? ` ${full_name}` : ''},</p><p>Welcome to Calm Breath! Please use the code below to verify your email address:</p><div class="code">${code}</div><p>This code will expire in 1 hour.</p><p>If you didn't create an account with Calm Breath, you can safely ignore this email.</p><div class="footer"><p>© 2026 Calm Breath. All rights reserved.</p></div></div></body></html>`
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: resendApiKey ? "Verification email sent" : "Verification code created (email not configured)",
        // Only return code in dev mode when email is not configured
        ...(resendApiKey ? {} : { devCode: code })
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
