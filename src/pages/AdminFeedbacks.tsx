import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MessageSquareHeart,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Trash2,
  Check,
  X,
  Eye,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbacks, Feedback } from "@/hooks/useFeedbacks";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import logo from "@/assets/calm-breath-logo.png";
import { format } from "date-fns";

const AdminFeedbacks = () => {
  const { t } = useTranslation();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { feedbacks, isLoading, fetchFeedbacks, updateFeedback, deleteFeedback } =
    useFeedbacks();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchEmail, setSearchEmail] = useState<string>("");

  // View dialog
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

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

  const handleApplyFilters = () => {
    fetchFeedbacks({
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setTypeFilter("");
    setDateFrom("");
    setDateTo("");
    setSearchEmail("");
    fetchFeedbacks();
  };

  const handleViewFeedback = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setAdminNotes(feedback.admin_notes || "");
  };

  const handleUpdateStatus = async (status: Feedback["status"]) => {
    if (!selectedFeedback) return;
    await updateFeedback(selectedFeedback.id, { status, admin_notes: adminNotes });
    setSelectedFeedback(null);
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      problem: "destructive" as any,
      result: "default",
      suggestion: "secondary",
    };
    const labels: Record<string, string> = {
      problem: t("feedback.problem"),
      result: t("feedback.result"),
      suggestion: t("feedback.suggestion"),
    };
    return <Badge variant={variants[type] || "outline"}>{labels[type] || type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      pending: "secondary",
      reviewed: "outline",
      resolved: "default",
      dismissed: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{t(`adminFeedbacks.status.${status}`)}</Badge>;
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (searchEmail && !f.email?.toLowerCase().includes(searchEmail.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Calm Breath" className="w-10 h-10" />
              <span className="text-xl font-bold text-foreground">
                {t("adminFeedbacks.title")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button variant="outline" onClick={() => navigate("/admin")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("nav.admin")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareHeart className="w-5 h-5" />
                  {t("adminFeedbacks.allFeedbacks")}
                </CardTitle>
                <CardDescription>
                  {filteredFeedbacks.length} {t("adminFeedbacks.feedbacksTotal")}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => fetchFeedbacks()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {t("adminUsers.refresh")}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("adminFeedbacks.searchEmail")}
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("adminFeedbacks.filterStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("adminFeedbacks.status.pending")}</SelectItem>
                  <SelectItem value="reviewed">{t("adminFeedbacks.status.reviewed")}</SelectItem>
                  <SelectItem value="resolved">{t("adminFeedbacks.status.resolved")}</SelectItem>
                  <SelectItem value="dismissed">{t("adminFeedbacks.status.dismissed")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("adminFeedbacks.filterType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="problem">{t("feedback.problem")}</SelectItem>
                  <SelectItem value="result">{t("feedback.result")}</SelectItem>
                  <SelectItem value="suggestion">{t("feedback.suggestion")}</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder={t("adminFeedbacks.dateFrom")}
              />

              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder={t("adminFeedbacks.dateTo")}
              />

              <div className="flex gap-2">
                <Button onClick={handleApplyFilters} size="sm" className="flex-1">
                  <Filter className="w-4 h-4 mr-1" />
                  {t("adminFeedbacks.apply")}
                </Button>
                <Button onClick={handleClearFilters} variant="outline" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminFeedbacks.date")}</TableHead>
                    <TableHead>{t("adminFeedbacks.user")}</TableHead>
                    <TableHead>{t("feedback.type")}</TableHead>
                    <TableHead>{t("adminFeedbacks.message")}</TableHead>
                    <TableHead>{t("admin.table.status")}</TableHead>
                    <TableHead className="text-right">{t("adminUsers.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeedbacks.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(feedback.created_at), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{feedback.user_name || "-"}</span>
                          <span className="text-xs text-muted-foreground">
                            {feedback.email || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(feedback.type)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {feedback.message}
                      </TableCell>
                      <TableCell>{getStatusBadge(feedback.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewFeedback(feedback)}
                            title={t("adminFeedbacks.view")}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={t("common.delete")}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t("adminFeedbacks.confirmDelete")}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("adminFeedbacks.confirmDeleteDesc")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteFeedback(feedback.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t("common.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredFeedbacks.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        {t("adminFeedbacks.noFeedbacks")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Feedback Dialog */}
        <Dialog
          open={!!selectedFeedback}
          onOpenChange={() => setSelectedFeedback(null)}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("adminFeedbacks.feedbackDetails")}</DialogTitle>
              <DialogDescription>
                {selectedFeedback &&
                  format(new Date(selectedFeedback.created_at), "dd/MM/yyyy HH:mm")}
              </DialogDescription>
            </DialogHeader>

            {selectedFeedback && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("adminFeedbacks.user")}
                    </p>
                    <p>{selectedFeedback.user_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("common.email")}
                    </p>
                    <p>{selectedFeedback.email || "-"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("feedback.type")}
                  </p>
                  {getTypeBadge(selectedFeedback.type)}
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("adminFeedbacks.message")}
                  </p>
                  <p className="bg-muted p-3 rounded-lg whitespace-pre-wrap">
                    {selectedFeedback.message}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("adminFeedbacks.adminNotes")}
                  </p>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={t("adminFeedbacks.adminNotesPlaceholder")}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => handleUpdateStatus("reviewed")}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {t("adminFeedbacks.markReviewed")}
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus("resolved")}
                    variant="default"
                    size="sm"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {t("adminFeedbacks.markResolved")}
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus("dismissed")}
                    variant="destructive"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {t("adminFeedbacks.markDismissed")}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminFeedbacks;
