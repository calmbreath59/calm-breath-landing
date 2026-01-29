import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, CreditCard, TrendingUp, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import logo from "@/assets/calm-breath-logo.png";

interface AdminStats {
  totalUsers: number;
  paidUsers: number;
  totalRevenue: number;
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    created_at: string;
    user_email: string;
  }>;
  recentUsers: Array<{
    id: string;
    email: string;
    full_name: string | null;
    has_paid: boolean;
    created_at: string;
  }>;
}

const Admin = () => {
  const { t } = useTranslation();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      fetchStats();
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchStats = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      const totalUsers = profiles?.length || 0;
      const paidUsers = profiles?.filter(p => p.has_paid).length || 0;
      const totalRevenue = payments
        ?.filter(p => p.status === "succeeded")
        .reduce((sum, p) => sum + (p.amount / 100), 0) || 0;

      const recentPayments = (payments?.slice(0, 10) || []).map(payment => {
        const userProfile = profiles?.find(p => p.user_id === payment.user_id);
        return {
          id: payment.id,
          amount: payment.amount / 100,
          status: payment.status || "pending",
          created_at: payment.created_at,
          user_email: userProfile?.email || "N/A",
        };
      });

      setStats({
        totalUsers,
        paidUsers,
        totalRevenue,
        recentPayments,
        recentUsers: (profiles?.slice(0, 10) || []).map(p => ({
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          has_paid: p.has_paid || false,
          created_at: p.created_at,
        })),
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setIsLoading(false);
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
              <span className="text-xl font-bold text-foreground">{t("admin.title")}</span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("nav.dashboard")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.stats.totalUsers")}</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.paidUsers || 0} {t("admin.stats.paidUsers").toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.stats.paidUsers")}</CardTitle>
              <CreditCard className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.paidUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalUsers ? Math.round((stats.paidUsers / stats.totalUsers) * 100) : 0}% {t("admin.stats.conversionRate").toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.stats.totalRevenue")}</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRevenue?.toFixed(2) || "0.00"}€</div>
              <p className="text-xs text-muted-foreground">
                {t("common.success")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tables */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.stats.totalUsers")}</CardTitle>
              <CardDescription>10 {t("common.previous").toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.email")}</TableHead>
                    <TableHead>{t("common.name")}</TableHead>
                    <TableHead>{t("admin.table.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">{user.email}</TableCell>
                      <TableCell>{user.full_name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={user.has_paid ? "default" : "secondary"}>
                          {user.has_paid ? t("common.success") : "No"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        {t("admin.noPayments")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.recentPayments")}</CardTitle>
              <CardDescription>10 {t("common.previous").toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.table.user")}</TableHead>
                    <TableHead>{t("admin.table.amount")}</TableHead>
                    <TableHead>{t("admin.table.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">{payment.user_email}</TableCell>
                      <TableCell>{payment.amount.toFixed(2)}€</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "succeeded"
                              ? "default"
                              : payment.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {payment.status === "succeeded"
                            ? t("common.success")
                            : payment.status === "pending"
                            ? t("common.loading")
                            : t("common.error")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!stats?.recentPayments || stats.recentPayments.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        {t("admin.noPayments")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;
