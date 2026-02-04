import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageSquareHeart, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const FeedbackButton = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"problem" | "result" | "suggestion">("problem");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  // Hide on admin pages
  const isAdminRoute = location.pathname.startsWith("/admin");
  if (isAdminRoute) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: t("common.error"),
        description: t("feedback.messageRequired"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
        },
        body: JSON.stringify({
          type: feedbackType,
          message: message.trim(),
          email: user ? profile?.email : email,
          userName: profile?.full_name || "Anonymous",
          userId: user?.id || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send feedback");
      }

      toast({
        title: t("feedback.success"),
        description: t("feedback.successDesc"),
      });
      
      setMessage("");
      setEmail("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error sending feedback:", error);
      toast({
        title: t("common.error"),
        description: t("feedback.error"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
          size="icon"
        >
          <MessageSquareHeart className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("feedback.title")}</DialogTitle>
          <DialogDescription>
            {t("feedback.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("feedback.type")}</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant={feedbackType === "problem" ? "default" : "outline"}
                size="sm"
                onClick={() => setFeedbackType("problem")}
              >
                {t("feedback.problem")}
              </Button>
              <Button
                type="button"
                variant={feedbackType === "result" ? "default" : "outline"}
                size="sm"
                onClick={() => setFeedbackType("result")}
              >
                {t("feedback.result")}
              </Button>
              <Button
                type="button"
                variant={feedbackType === "suggestion" ? "default" : "outline"}
                size="sm"
                onClick={() => setFeedbackType("suggestion")}
              >
                {t("feedback.suggestion")}
              </Button>
            </div>
          </div>

          {!user && (
            <div className="space-y-2">
              <Label htmlFor="feedback-email">{t("common.email")}</Label>
              <Input
                id="feedback-email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="feedback-message">{t("feedback.message")}</Label>
            <Textarea
              id="feedback-message"
              placeholder={t("feedback.messagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/1000
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("common.loading")}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t("feedback.send")}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
