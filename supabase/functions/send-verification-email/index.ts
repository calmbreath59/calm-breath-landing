import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Generate 6-digit code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing codes for this user
    await adminClient
      .from("email_verification_codes")
      .delete()
      .eq("user_id", user_id);

    // Insert new code
    const { error: insertError } = await adminClient
      .from("email_verification_codes")
      .insert({
        user_id,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error inserting code:", insertError);
      throw new Error("Failed to create verification code");
    }

    // Check if Resend API key is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendApiKey) {
      // Use fetch to call Resend API directly
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Calm Breath <noreply@calmbreath.app>",
          to: [email],
          subject: "Verify your email - Calm Breath",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .code { font-size: 32px; font-weight: bold; text-align: center; 
                        background: #f5f5f5; padding: 20px; border-radius: 8px; 
                        letter-spacing: 8px; margin: 20px 0; }
                .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🧘 Calm Breath</h1>
                </div>
                <p>Hello${full_name ? ` ${full_name}` : ''},</p>
                <p>Welcome to Calm Breath! Please use the code below to verify your email address:</p>
                <div class="code">${code}</div>
                <p>This code will expire in 1 hour.</p>
                <p>If you didn't create an account with Calm Breath, you can safely ignore this email.</p>
                <div class="footer">
                  <p>© 2026 Calm Breath. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        }),
      });

      const emailResult = await emailResponse.json();
      console.log("Verification email sent:", emailResult);
    } else {
      // Log the code for development (remove in production)
      console.log(`[DEV] Verification code for ${email}: ${code}`);
    }

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
