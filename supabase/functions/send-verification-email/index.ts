import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { encode as encodeHex } from "https://deno.land/std@0.190.0/encoding/hex.ts";

// Helper function to create CORS headers
function createCorsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-supabase-client-name, x-supabase-client-version, accept, accept-language, content-language, x-requested-with",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET, PUT, DELETE, PATCH",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Expose-Headers": "content-type, content-length",
  };
}

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
  const origin = req.headers.get("Origin");
  const corsHeaders = createCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("OPTIONS request received, headers:", Object.keys(corsHeaders));
    console.log("Access-Control-Allow-Headers:", corsHeaders["Access-Control-Allow-Headers"]);
    return new Response(null, { 
      headers: corsHeaders,
      status: 204,
    });
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

    // Cooldown: verificar último envio (5 minutos)
    const { data: lastCode } = await adminClient
      .from("email_verification_codes")
      .select("created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastCode?.created_at) {
      const lastSent = new Date(lastCode.created_at).getTime();
      const now = Date.now();
      const cooldownMs = 5 * 60 * 1000; // 5 minutos
      if (now - lastSent < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - (now - lastSent)) / 1000);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Por favor aguarde mais ${remainingSeconds} segundos antes de pedir novo email.` 
          }),
          {
            headers: { 
              ...corsHeaders,
              "Content-Type": "application/json" 
            },
            status: 429,
          }
        );
      }
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

    // Enviar email via API da Vercel (que usa nodemailer com Gmail SMTP)
    const emailHtml = `<!DOCTYPE html><html><head><style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; } .container { max-width: 600px; margin: 0 auto; padding: 20px; } .header { text-align: center; margin-bottom: 30px; } .code { font-size: 32px; font-weight: bold; text-align: center; background: #f5f5f5; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0; } .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }</style></head><body><div class="container"><div class="header"><h1>🧘 Calm Breath</h1></div><p>Hello${full_name ? ` ${full_name}` : ''},</p><p>Welcome to Calm Breath! Please use the code below to verify your email address:</p><div class="code">${code}</div><p>This code will expire in 1 hour.</p><p>If you didn't create an account with Calm Breath, you can safely ignore this email.</p><div class="footer"><p>© 2026 Calm Breath. All rights reserved.</p></div></div></body></html>`;

    try {
      // Chamar API da Vercel que faz o envio via SMTP Gmail
      const vercelUrl = Deno.env.get("VERCEL_URL") || "https://calm-breath-landing.vercel.app";
      const emailServiceUrl = `${vercelUrl}/api/send-email`;
      
      const emailResponse = await fetch(emailServiceUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: "Verify your email - Calm Breath",
          html: emailHtml,
        }),
      });
      
      if (emailResponse.ok) {
        console.log("Email sent successfully to:", email);
      } else {
        const errorText = await emailResponse.text();
        console.error("Email service error:", errorText);
        // Log mas não falha - código já foi criado
      }
    } catch (emailError) {
      console.error("Error calling email service:", emailError);
      // Log mas não falha - código já foi criado
      // Em dev, mostrar código no console
      console.log(`[DEV] Verification code for ${email}: ${code}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification email sent",
      }),
      {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
        status: 500,
      }
    );
  }
});
