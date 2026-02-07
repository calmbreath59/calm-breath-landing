import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Ban, Send, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface BanAppeal {
  id: string;
  user_id: string;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const Banned = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, signOut, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [appealMessage, setAppealMessage] = useState("");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const { data: appeals = [], isLoading: appealsLoading } = useQuery({
    queryKey: ["ban-appeals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ban_appeals")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BanAppeal[];
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: true,
  });

  const submitAppeal = useMutation({
    mutationFn: async (message: string) => {
      const { error } = await supabase.from("ban_appeals").insert({
        user_id: user?.id,
        message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("banned.appealSubmitted"));
      setAppealMessage("");
      queryClient.invalidateQueries({ queryKey: ["ban-appeals"] });
    },
    onError: () => {
      toast.error(t("banned.appealError"));
    },
  });

  const isLoading = authLoading || appealsLoading;
  const hasPendingAppeal = appeals.some((a) => a.status === "pending");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{t("banned.pending")}</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />{t("banned.approved")}</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{t("banned.rejected")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="border-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Ban className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">{t("banned.title")}</CardTitle>
            <CardDescription className="text-base">
              {t("banned.description")}
            </CardDescription>
            {profile?.banned_at && (
              <p className="text-sm text-muted-foreground mt-2">
                {t("banned.bannedOn")}: {format(new Date(profile.banned_at), "PPP")}
              </p>
            )}
          </CardHeader>
        </Card>

        {!hasPendingAppeal && (
          <Card>
            <CardHeader>
              <CardTitle>{t("banned.submitAppeal")}</CardTitle>
              <CardDescription>{t("banned.appealDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={t("banned.appealPlaceholder")}
                value={appealMessage}
                onChange={(e) => setAppealMessage(e.target.value)}
                rows={5}
                maxLength={1000}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {appealMessage.length}/1000
                </span>
                <Button
                  onClick={() => submitAppeal.mutate(appealMessage)}
                  disabled={!appealMessage.trim() || submitAppeal.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {t("banned.submit")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {appeals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("banned.yourAppeals")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {appeals.map((appeal) => (
                <div key={appeal.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    {getStatusBadge(appeal.status)}
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(appeal.created_at), "PPp")}
                    </span>
                  </div>
                  <p className="text-sm">{appeal.message}</p>
                  {appeal.admin_notes && (
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">{t("banned.adminResponse")}:</p>
                      <p className="text-sm text-muted-foreground">{appeal.admin_notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button variant="outline" onClick={handleSignOut}>
            {t("common.logout")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Banned;
