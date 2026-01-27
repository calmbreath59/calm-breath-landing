import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const initiatePayment = async (email?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { email },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o pagamento. Tenta novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { email },
      });

      if (error) throw error;

      return data?.hasPaid ?? false;
    } catch (error) {
      console.error("Verification error:", error);
      return false;
    }
  };

  return {
    initiatePayment,
    verifyPayment,
    isLoading,
  };
};
