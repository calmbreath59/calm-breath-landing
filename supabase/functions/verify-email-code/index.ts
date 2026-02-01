import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { encode as encodeHex } from "https://deno.land/std@0.190.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-supabase-client-name, x-supabase-client-version, accept, accept-language, content-language",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Max-Age": "86400",
};

interface VerifyCodeRequest {
  user_id: string;
  code: string;
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

    const { user_id, code }: VerifyCodeRequest = await req.json();

    if (!user_id || !code) {
      throw new Error("user_id and code are required");
    }

    // Hash the provided code to compare with stored hash
    const hashedCode = await hashCode(code);

    // Get the verification code by user_id only (we'll compare hashes)
    const { data: codeData, error: fetchError } = await adminClient
      .from("email_verification_codes")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching code:", fetchError);
      throw new Error("Failed to verify code");
    }

    // Check if code exists and hashes match
    if (!codeData || codeData.code !== hashedCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid verification code" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Check if code is expired
    const expiresAt = new Date(codeData.expires_at);
    if (expiresAt < new Date()) {
      // Delete expired code
      await adminClient
        .from("email_verification_codes")
        .delete()
        .eq("id", codeData.id);

      return new Response(
        JSON.stringify({ success: false, error: "Verification code has expired" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Code is valid - update profile to mark email as verified
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ email_verified: true })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw new Error("Failed to verify email");
    }

    // Delete the used code
    await adminClient
      .from("email_verification_codes")
      .delete()
      .eq("id", codeData.id);

    console.log(`Email verified for user ${user_id}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email verified successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error verifying code:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
