import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, MoreVertical, Edit, Trash2, Flag, EyeOff, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { pt, enUS } from "date-fns/locale";

interface CommentSectionProps {
  mediaItemId: string;
}

export const CommentSection = ({ mediaItemId }: CommentSectionProps) => {
  const { t, i18n } = useTranslation();
  const { user, isAdmin } = useAuth();
  const {
    comments,
    isLoading,
    createComment,
    updateComment,
    deleteComment,
    hideComment,
    reportComment,
  } = useComments(mediaItemId);

  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  const dateLocale = i18n.language === "pt" ? pt : enUS;

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await createComment(newComment.trim(), user.id);
      setNewComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return;

    await updateComment(id, editContent.trim());
    setEditingId(null);
    setEditContent("");
  };

  const handleReport = async () => {
    if (!reportingCommentId || !reportReason.trim() || !user) return;

    await reportComment(reportingCommentId, user.id, reportReason.trim());
    setReportDialogOpen(false);
    setReportingCommentId(null);
    setReportReason("");
  };

  const openReportDialog = (commentId: string) => {
    setReportingCommentId(commentId);
    setReportDialogOpen(true);
  };

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || "?";
  };

  const visibleComments = isAdmin
    ? comments
    : comments.filter((c) => !c.is_hidden_by_admin);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("comments.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Comment Form */}
        {user && (
          <div className="flex gap-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("comments.placeholder")}
              className="flex-1 min-h-[80px]"
            />
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              className="self-end"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}

        {/* Comments List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 bg-muted rounded" />
                  <div className="h-12 w-full bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleComments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {t("comments.empty")}
          </p>
        ) : (
          <div className="space-y-4">
            {visibleComments.map((comment) => (
              <div
                key={comment.id}
                className={`flex gap-3 ${
                  comment.is_hidden_by_admin ? "opacity-50 bg-muted/50 p-3 rounded-lg" : ""
                }`}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={comment.profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {getInitials(comment.profile?.full_name, comment.profile?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">
                        {comment.profile?.full_name || comment.profile?.email || t("comments.anonymous")}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </span>
                      {comment.is_hidden_by_admin && (
                        <span className="text-xs text-destructive flex-shrink-0">
                          ({t("comments.hidden")})
                        </span>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* User actions */}
                        {user?.id === comment.user_id && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingId(comment.id);
                                setEditContent(comment.content);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteComment(comment.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t("common.delete")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {/* Report action */}
                        {user && user.id !== comment.user_id && (
                          <DropdownMenuItem onClick={() => openReportDialog(comment.id)}>
                            <Flag className="w-4 h-4 mr-2" />
                            {t("comments.report")}
                          </DropdownMenuItem>
                        )}
                        {/* Admin actions */}
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => hideComment(comment.id, !comment.is_hidden_by_admin)}
                            >
                              {comment.is_hidden_by_admin ? (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  {t("comments.show")}
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  {t("comments.hide")}
                                </>
                              )}
                            </DropdownMenuItem>
                            {user?.id !== comment.user_id && (
                              <DropdownMenuItem
                                onClick={() => deleteComment(comment.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t("common.delete")}
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {editingId === comment.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[60px]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEdit(comment.id)}>
                          {t("common.save")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditContent("");
                          }}
                        >
                          {t("common.cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("comments.reportTitle")}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder={t("comments.reportPlaceholder")}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleReport} disabled={!reportReason.trim()}>
              {t("comments.report")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
