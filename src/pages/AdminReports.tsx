import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Flag, Eye, EyeOff, Trash2, Ban, Loader2, CheckCircle, XCircle, RotateCcw, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCommentReports } from "@/hooks/useCommentReports";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { formatDistanceToNow } from "date-fns";
import { pt, enUS } from "date-fns/locale";
import logo from "@/assets/calm-breath-logo.png";

const AdminReports = () => {
  const { t, i18n } = useTranslation();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { reports, isLoading, updateReportStatus, hideComment, deleteComment, deleteReport, reopenReport, fetchReports } =
    useCommentReports();
  const { createNotification } = useNotifications();

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [deleteReportDialogOpen, setDeleteReportDialogOpen] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editNotesDialogOpen, setEditNotesDialogOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");

  const dateLocale = i18n.language === "pt" ? pt : enUS;

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      if (!isAdmin) {
        navigate("/dashboard");
        return;
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleHideComment = async (commentId: string, userId: string, hidden: boolean) => {
    await hideComment(commentId, hidden);
    if (hidden) {
      await createNotification(
        userId,
        "comment_hidden",
        t("notifications.commentHiddenTitle"),
        t("notifications.commentHiddenMessage")
      );
    }
  };

  const handleDeleteComment = async () => {
    if (!deletingCommentId || !deletingUserId) return;

    await deleteComment(deletingCommentId);
    await createNotification(
      deletingUserId,
      "comment_deleted",
      t("notifications.commentDeletedTitle"),
      t("notifications.commentDeletedMessage")
    );
    setDeleteDialogOpen(false);
    setDeletingCommentId(null);
    setDeletingUserId(null);
  };

  const handleBanUser = async () => {
    if (!banningUserId) return;

    try {
      await supabase
        .from("profiles")
        .update({ is_banned: true, banned_at: new Date().toISOString() })
        .eq("user_id", banningUserId);

      await createNotification(
        banningUserId,
        "account_banned",
        t("notifications.accountBannedTitle"),
        t("notifications.accountBannedMessage")
      );

      await fetchReports();
    } catch (error) {
      console.error("Error banning user:", error);
    }

    setBanDialogOpen(false);
    setBanningUserId(null);
  };

  const handleReviewReport = async (status: "reviewed" | "dismissed") => {
    if (!selectedReportId) return;

    await updateReportStatus(selectedReportId, status, adminNotes);
    setNotesDialogOpen(false);
    setSelectedReportId(null);
    setAdminNotes("");
  };

  const openDeleteDialog = (commentId: string, userId: string) => {
    setDeletingCommentId(commentId);
    setDeletingUserId(userId);
    setDeleteDialogOpen(true);
  };

  const openBanDialog = (userId: string) => {
    setBanningUserId(userId);
    setBanDialogOpen(true);
  };

  const openNotesDialog = (reportId: string) => {
    setSelectedReportId(reportId);
    setNotesDialogOpen(true);
  };

  const openDeleteReportDialog = (reportId: string) => {
    setDeletingReportId(reportId);
    setDeleteReportDialogOpen(true);
  };

  const handleDeleteReport = async () => {
    if (!deletingReportId) return;
    await deleteReport(deletingReportId);
    setDeleteReportDialogOpen(false);
    setDeletingReportId(null);
  };

  const openEditNotesDialog = (reportId: string, currentNotes: string | null) => {
    setEditingReportId(reportId);
    setEditNotes(currentNotes || "");
    setEditNotesDialogOpen(true);
  };

  const handleEditNotes = async (status: "reviewed" | "dismissed") => {
    if (!editingReportId) return;
    await updateReportStatus(editingReportId, status, editNotes);
    setEditNotesDialogOpen(false);
    setEditingReportId(null);
    setEditNotes("");
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "reviewed":
        return <Badge variant="default">{t("moderation.reviewed")}</Badge>;
      case "dismissed":
        return <Badge variant="secondary">{t("moderation.dismissed")}</Badge>;
      default:
        return <Badge variant="destructive">{t("moderation.pending")}</Badge>;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingReports = reports.filter((r) => r.status === "pending" || !r.status);
  const reviewedReports = reports.filter((r) => r.status === "reviewed" || r.status === "dismissed");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Calm Breath" className="w-10 h-10" />
              <span className="text-xl font-bold text-foreground">{t("moderation.title")}</span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button variant="outline" onClick={() => navigate("/admin")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("common.back")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Pending Reports */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-destructive" />
              <CardTitle>{t("moderation.pendingReports")}</CardTitle>
            </div>
            <CardDescription>
              {pendingReports.length} {t("moderation.reportsToReview")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingReports.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t("moderation.noReports")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("moderation.reporter")}</TableHead>
                    <TableHead>{t("moderation.comment")}</TableHead>
                    <TableHead>{t("moderation.reason")}</TableHead>
                    <TableHead>{t("moderation.date")}</TableHead>
                    <TableHead>{t("moderation.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{report.reporter?.full_name || report.reporter?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm truncate">{report.comment?.content}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("moderation.by")} {report.comment?.profile?.full_name || report.comment?.profile?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm max-w-xs truncate">{report.reason}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(report.created_at), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {report.comment && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleHideComment(
                                    report.comment!.id,
                                    report.comment!.user_id,
                                    !report.comment!.is_hidden_by_admin
                                  )
                                }
                                title={report.comment.is_hidden_by_admin ? t("comments.show") : t("comments.hide")}
                              >
                                {report.comment.is_hidden_by_admin ? (
                                  <Eye className="w-4 h-4" />
                                ) : (
                                  <EyeOff className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(report.comment!.id, report.comment!.user_id)}
                                title={t("common.delete")}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openBanDialog(report.comment!.user_id)}
                                title={t("moderation.banUser")}
                              >
                                <Ban className="w-4 h-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openNotesDialog(report.id)}
                            title={t("moderation.review")}
                          >
                            <CheckCircle className="w-4 h-4 text-primary" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Reviewed Reports */}
        <Card>
          <CardHeader>
            <CardTitle>{t("moderation.reviewedReports")}</CardTitle>
            <CardDescription>
              {reviewedReports.length} {t("moderation.processedReports")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reviewedReports.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t("moderation.noProcessedReports")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("moderation.reporter")}</TableHead>
                    <TableHead>{t("moderation.reason")}</TableHead>
                    <TableHead>{t("moderation.status")}</TableHead>
                    <TableHead>{t("moderation.notes")}</TableHead>
                    <TableHead>{t("moderation.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewedReports.slice(0, 10).map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <p className="text-sm">{report.reporter?.full_name || report.reporter?.email}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm max-w-xs truncate">{report.reason}</p>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground max-w-xs truncate">
                          {report.admin_notes || "—"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditNotesDialog(report.id, report.admin_notes)}
                            title={t("moderation.edit")}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => reopenReport(report.id)}
                            title={t("moderation.reopen")}
                          >
                            <RotateCcw className="w-4 h-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteReportDialog(report.id)}
                            title={t("common.delete")}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Comment Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("moderation.deleteComment")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("moderation.deleteCommentConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              className="bg-destructive text-destructive-foreground"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban User Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("moderation.banUser")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("moderation.banUserConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              className="bg-destructive text-destructive-foreground"
            >
              {t("moderation.ban")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("moderation.reviewReport")}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder={t("moderation.notesPlaceholder")}
            className="min-h-[100px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleReviewReport("dismissed")}>
              <XCircle className="w-4 h-4 mr-2" />
              {t("moderation.dismiss")}
            </Button>
            <Button onClick={() => handleReviewReport("reviewed")}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {t("moderation.markReviewed")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Report Dialog */}
      <AlertDialog open={deleteReportDialogOpen} onOpenChange={setDeleteReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("moderation.deleteReport")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("moderation.deleteReportConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReport}
              className="bg-destructive text-destructive-foreground"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Notes Dialog */}
      <Dialog open={editNotesDialogOpen} onOpenChange={setEditNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("moderation.editReport")}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder={t("moderation.notesPlaceholder")}
            className="min-h-[100px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleEditNotes("dismissed")}>
              <XCircle className="w-4 h-4 mr-2" />
              {t("moderation.dismiss")}
            </Button>
            <Button onClick={() => handleEditNotes("reviewed")}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {t("moderation.markReviewed")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;
