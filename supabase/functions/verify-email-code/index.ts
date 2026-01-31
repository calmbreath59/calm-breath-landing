import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyCodeRequest {
  user_id: string;
  code: string;
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

    // Get the verification code
    const { data: codeData, error: fetchError } = await adminClient
      .from("email_verification_codes")
      .select("*")
      .eq("user_id", user_id)
      .eq("code", code)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching code:", fetchError);
      throw new Error("Failed to verify code");
    }

    if (!codeData) {
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
