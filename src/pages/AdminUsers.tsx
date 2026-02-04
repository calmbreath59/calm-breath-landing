import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, ArrowLeft, Loader2, Shield, ShieldOff, Ban, CheckCircle, Trash2, RefreshCw, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useToast } from "@/hooks/use-toast";
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
import logo from "@/assets/calm-breath-logo.png";
import { format } from "date-fns";

interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  has_paid: boolean;
  is_banned: boolean;
  created_at: string | null;
  role: "admin" | "user";
}

const AdminUsers = () => {
  const { t } = useTranslation();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

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
      fetchUsers();
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          has_paid: profile.has_paid || false,
          is_banned: profile.is_banned || false,
          created_at: profile.created_at,
          role: (userRole?.role as "admin" | "user") || "user",
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: t("common.error"),
        description: t("adminUsers.fetchError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setRoleFilter("");
    setPaymentFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const filteredUsers = users.filter((u) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !u.email.toLowerCase().includes(query) &&
        !u.full_name?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Role filter
    if (roleFilter && u.role !== roleFilter) {
      return false;
    }

    // Payment filter
    if (paymentFilter === "paid" && !u.has_paid) return false;
    if (paymentFilter === "unpaid" && u.has_paid) return false;

    // Status filter
    if (statusFilter === "active" && u.is_banned) return false;
    if (statusFilter === "banned" && !u.is_banned) return false;

    // Date filter
    if (dateFrom && u.created_at) {
      if (new Date(u.created_at) < new Date(dateFrom)) return false;
    }
    if (dateTo && u.created_at) {
      if (new Date(u.created_at) > new Date(dateTo + "T23:59:59")) return false;
    }

    return true;
  });

  const handleToggleBan = async (targetUser: UserWithRole) => {
    if (targetUser.user_id === user?.id) {
      toast({
        title: t("common.error"),
        description: t("adminUsers.cannotBanSelf"),
        variant: "destructive",
      });
      return;
    }

    setActionLoading(targetUser.id);
    try {
      const newBanStatus = !targetUser.is_banned;
      const { error } = await supabase
        .from("profiles")
        .update({
          is_banned: newBanStatus,
          banned_at: newBanStatus ? new Date().toISOString() : null,
        })
        .eq("user_id", targetUser.user_id);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, is_banned: newBanStatus } : u
        )
      );

      toast({
        title: t("common.success"),
        description: newBanStatus
          ? t("adminUsers.userBanned")
          : t("adminUsers.userUnbanned"),
      });
    } catch (error) {
      console.error("Error toggling ban:", error);
      toast({
        title: t("common.error"),
        description: t("adminUsers.actionError"),
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAdmin = async (targetUser: UserWithRole) => {
    if (targetUser.user_id === user?.id) {
      toast({
        title: t("common.error"),
        description: t("adminUsers.cannotChangeOwnRole"),
        variant: "destructive",
      });
      return;
    }

    setActionLoading(targetUser.id);
    try {
      const newRole = targetUser.role === "admin" ? "user" : "admin";

      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", targetUser.user_id);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, role: newRole } : u
        )
      );

      toast({
        title: t("common.success"),
        description:
          newRole === "admin"
            ? t("adminUsers.adminGranted")
            : t("adminUsers.adminRevoked"),
      });
    } catch (error) {
      console.error("Error toggling admin:", error);
      toast({
        title: t("common.error"),
        description: t("adminUsers.actionError"),
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (targetUser: UserWithRole) => {
    if (targetUser.user_id === user?.id) {
      toast({
        title: t("common.error"),
        description: t("adminUsers.cannotDeleteSelf"),
        variant: "destructive",
      });
      return;
    }

    setActionLoading(targetUser.id);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: targetUser.user_id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));

      toast({
        title: t("common.success"),
        description: t("adminUsers.userDeleted"),
      });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("adminUsers.actionError"),
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

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
              <span className="text-xl font-bold text-foreground">{t("adminUsers.title")}</span>
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
                  <Users className="w-5 h-5" />
                  {t("adminUsers.allUsers")}
                </CardTitle>
                <CardDescription>
                  {filteredUsers.length} {t("adminUsers.usersTotal")}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={fetchUsers}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {t("adminUsers.refresh")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("adminUsers.searchUser")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("adminUsers.filterRole")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t("adminUsers.admin")}</SelectItem>
                  <SelectItem value="user">{t("adminUsers.user")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("adminUsers.filterPayment")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">{t("common.success")}</SelectItem>
                  <SelectItem value="unpaid">{t("adminUsers.unpaid")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("adminUsers.filterStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("adminUsers.active")}</SelectItem>
                  <SelectItem value="banned">{t("adminUsers.banned")}</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder={t("adminFeedbacks.dateFrom")}
              />

              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder={t("adminFeedbacks.dateTo")}
                  className="flex-1"
                />
                <Button onClick={handleClearFilters} variant="outline" size="icon">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.email")}</TableHead>
                    <TableHead>{t("common.name")}</TableHead>
                    <TableHead>{t("adminUsers.role")}</TableHead>
                    <TableHead>{t("adminUsers.status")}</TableHead>
                    <TableHead>{t("adminUsers.payment")}</TableHead>
                    <TableHead>{t("adminUsers.createdAt")}</TableHead>
                    <TableHead className="text-right">{t("adminUsers.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id} className={u.is_banned ? "opacity-50" : ""}>
                      <TableCell className="font-mono text-sm">{u.email}</TableCell>
                      <TableCell>{u.full_name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                          {u.role === "admin" ? t("adminUsers.admin") : t("adminUsers.user")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.is_banned ? (
                          <Badge variant="destructive">{t("adminUsers.banned")}</Badge>
                        ) : (
                          <Badge variant="outline">{t("adminUsers.active")}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.has_paid ? "default" : "secondary"}>
                          {u.has_paid ? t("common.success") : t("adminUsers.unpaid")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.created_at ? format(new Date(u.created_at), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleAdmin(u)}
                            disabled={actionLoading === u.id || u.user_id === user?.id}
                            title={u.role === "admin" ? t("adminUsers.revokeAdmin") : t("adminUsers.grantAdmin")}
                          >
                            {actionLoading === u.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : u.role === "admin" ? (
                              <ShieldOff className="w-4 h-4" />
                            ) : (
                              <Shield className="w-4 h-4" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleBan(u)}
                            disabled={actionLoading === u.id || u.user_id === user?.id}
                            title={u.is_banned ? t("adminUsers.unban") : t("adminUsers.ban")}
                          >
                            {actionLoading === u.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : u.is_banned ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Ban className="w-4 h-4 text-destructive" />
                            )}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={actionLoading === u.id || u.user_id === user?.id}
                                title={t("adminUsers.deleteUser")}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("adminUsers.confirmDelete")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("adminUsers.confirmDeleteDesc", { email: u.email })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(u)}
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
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {t("adminUsers.noUsers")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminUsers;
