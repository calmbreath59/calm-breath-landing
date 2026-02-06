import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle, XCircle, Trash2, RotateCcw, Clock, Edit } from "lucide-react";

interface BanAppeal {
  id: string;
  user_id: string;
  message: string;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  email: string;
  full_name: string | null;
}

const AdminAppeals = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedAppeal, setSelectedAppeal] = useState<BanAppeal | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: appeals = [], isLoading } = useQuery({
    queryKey: ["admin-ban-appeals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ban_appeals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BanAppeal[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-appeals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, full_name");

      if (error) throw error;
      return data as Profile[];
    },
  });

  const getProfile = (userId: string) => profiles.find((p) => p.user_id === userId);

  const reviewAppeal = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error: appealError } = await supabase
        .from("ban_appeals")
        .update({
          status,
          admin_notes: notes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (appealError) throw appealError;

      // If approved, unban the user
      if (status === "approved") {
        const appeal = appeals.find((a) => a.id === id);
        if (appeal) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ is_banned: false, banned_at: null })
            .eq("user_id", appeal.user_id);

          if (profileError) throw profileError;
        }
      }
    },
    onSuccess: () => {
      toast.success(t("adminAppeals.reviewSuccess"));
      setReviewDialogOpen(false);
      setSelectedAppeal(null);
      setAdminNotes("");
      queryClient.invalidateQueries({ queryKey: ["admin-ban-appeals"] });
    },
    onError: () => {
      toast.error(t("adminAppeals.reviewError"));
    },
  });

  const deleteAppeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ban_appeals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("adminAppeals.deleteSuccess"));
      setDeleteDialogOpen(false);
      setSelectedAppeal(null);
      queryClient.invalidateQueries({ queryKey: ["admin-ban-appeals"] });
    },
    onError: () => {
      toast.error(t("adminAppeals.deleteError"));
    },
  });

  const reopenAppeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ban_appeals")
        .update({ status: "pending", admin_notes: null, reviewed_by: null, reviewed_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("adminAppeals.reopenSuccess"));
      queryClient.invalidateQueries({ queryKey: ["admin-ban-appeals"] });
    },
    onError: () => {
      toast.error(t("adminAppeals.reopenError"));
    },
  });

  const updateAppeal = useMutation({
    mutationFn: async ({ id, notes, status }: { id: string; notes: string; status: string }) => {
      const { error } = await supabase
        .from("ban_appeals")
        .update({ admin_notes: notes, status })
        .eq("id", id);
      if (error) throw error;

      // Handle ban status based on appeal status
      const appeal = appeals.find((a) => a.id === id);
      if (appeal) {
        if (status === "approved") {
          await supabase
            .from("profiles")
            .update({ is_banned: false, banned_at: null })
            .eq("user_id", appeal.user_id);
        } else if (status === "rejected") {
          await supabase
            .from("profiles")
            .update({ is_banned: true })
            .eq("user_id", appeal.user_id);
        }
      }
    },
    onSuccess: () => {
      toast.success(t("adminAppeals.updateSuccess"));
      setEditDialogOpen(false);
      setSelectedAppeal(null);
      setAdminNotes("");
      queryClient.invalidateQueries({ queryKey: ["admin-ban-appeals"] });
    },
    onError: () => {
      toast.error(t("adminAppeals.updateError"));
    },
  });

  const pendingAppeals = appeals.filter((a) => a.status === "pending");
  const reviewedAppeals = appeals.filter((a) => a.status !== "pending");

  const openReviewDialog = (appeal: BanAppeal, action: "approved" | "rejected") => {
    setSelectedAppeal(appeal);
    setReviewAction(action);
    setAdminNotes("");
    setReviewDialogOpen(true);
  };

  const openEditDialog = (appeal: BanAppeal) => {
    setSelectedAppeal(appeal);
    setAdminNotes(appeal.admin_notes || "");
    setEditDialogOpen(true);
  };

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

  const renderAppealsTable = (appealsList: BanAppeal[], showActions: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("adminAppeals.user")}</TableHead>
          <TableHead>{t("adminAppeals.message")}</TableHead>
          <TableHead>{t("adminAppeals.status")}</TableHead>
          <TableHead>{t("adminAppeals.date")}</TableHead>
          <TableHead>{t("adminAppeals.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appealsList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              {t("adminAppeals.noAppeals")}
            </TableCell>
          </TableRow>
        ) : (
          appealsList.map((appeal) => {
            const profile = getProfile(appeal.user_id);
            return (
              <TableRow key={appeal.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{profile?.full_name || t("common.unknown")}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <p className="truncate" title={appeal.message}>{appeal.message}</p>
                  {appeal.admin_notes && (
                    <p className="text-sm text-muted-foreground mt-1 truncate" title={appeal.admin_notes}>
                      {t("adminAppeals.notes")}: {appeal.admin_notes}
                    </p>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(appeal.status)}</TableCell>
                <TableCell className="text-sm">
                  {format(new Date(appeal.created_at), "PPp")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {showActions ? (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => openReviewDialog(appeal, "approved")}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openReviewDialog(appeal, "rejected")}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(appeal)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => reopenAppeal.mutate(appeal.id)}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedAppeal(appeal);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t("adminAppeals.title")}</h1>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              {t("adminAppeals.pending")} ({pendingAppeals.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed">
              {t("adminAppeals.reviewed")} ({reviewedAppeals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {renderAppealsTable(pendingAppeals, true)}
          </TabsContent>

          <TabsContent value="reviewed">
            {renderAppealsTable(reviewedAppeals, false)}
          </TabsContent>
        </Tabs>
      </main>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approved" ? t("adminAppeals.approveTitle") : t("adminAppeals.rejectTitle")}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approved" ? t("adminAppeals.approveDescription") : t("adminAppeals.rejectDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">{t("adminAppeals.appealMessage")}:</p>
              <p className="text-sm">{selectedAppeal?.message}</p>
            </div>
            <Textarea
              placeholder={t("adminAppeals.notesPlaceholder")}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant={reviewAction === "approved" ? "default" : "destructive"}
              className={reviewAction === "approved" ? "bg-green-600 hover:bg-green-700" : ""}
              onClick={() => {
                if (selectedAppeal && reviewAction) {
                  reviewAppeal.mutate({
                    id: selectedAppeal.id,
                    status: reviewAction,
                    notes: adminNotes,
                  });
                }
              }}
            >
              {reviewAction === "approved" ? t("adminAppeals.approve") : t("adminAppeals.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminAppeals.editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">{t("adminAppeals.appealMessage")}:</p>
              <p className="text-sm">{selectedAppeal?.message}</p>
            </div>
            <Textarea
              placeholder={t("adminAppeals.notesPlaceholder")}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedAppeal) {
                  updateAppeal.mutate({ id: selectedAppeal.id, notes: adminNotes, status: "rejected" });
                }
              }}
            >
              {t("adminAppeals.saveAsRejected")}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (selectedAppeal) {
                  updateAppeal.mutate({ id: selectedAppeal.id, notes: adminNotes, status: "approved" });
                }
              }}
            >
              {t("adminAppeals.saveAsApproved")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("adminAppeals.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("adminAppeals.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selectedAppeal && deleteAppeal.mutate(selectedAppeal.id)}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAppeals;
