import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ hasPaid: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if customer has made a successful payment
    const customers = await stripe.customers.list({ email, limit: 1 });
    
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
