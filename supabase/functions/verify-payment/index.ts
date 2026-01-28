import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ hasPaid: false, error: "Not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      return new Response(JSON.stringify({ hasPaid: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if customer has made a successful payment
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ hasPaid: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;

    // Check for successful payments
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 10,
    });

    const hasPaid = paymentIntents.data.some(
      (pi: { status: string }) => pi.status === "succeeded"
    );

    // Update profile and payments if paid
    if (hasPaid) {
      // Update profile
      await supabaseAdmin
        .from("profiles")
        .update({ 
          has_paid: true,
          stripe_customer_id: customerId,
        })
        .eq("user_id", user.id);

      // Update payment records
      const successfulPayment = paymentIntents.data.find((pi: { status: string; id: string }) => pi.status === "succeeded");
      if (successfulPayment) {
        await supabaseAdmin
          .from("payments")
          .update({ 
            status: "succeeded",
            stripe_payment_intent_id: successfulPayment.id,
          })
          .eq("user_id", user.id)
          .eq("status", "pending");
      }
    }

    return new Response(JSON.stringify({ hasPaid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error verifying payment:", error);
    return new Response(JSON.stringify({ error: message, hasPaid: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
