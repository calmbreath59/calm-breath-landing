import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import logo from "@/assets/calm-breath-logo.png";
import { z } from "zod";

type AuthStep = "login" | "register";

const Auth = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState<AuthStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, user } = useAuth();

  const authSchema = z.object({
    email: z.string().trim().email(t("common.error")).max(255),
    password: z.string().min(6).max(128),
    fullName: z.string().trim().max(100).optional(),
  });

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") {
      setStep("register");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validation = authSchema.safeParse({
        email,
        password,
        fullName: step === "register" ? fullName : undefined,
      });

      if (!validation.success) {
        toast({
          title: t("common.error"),
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (step === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: t("common.error"),
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: t("auth.welcomeBack"),
            description: t("common.success"),
          });
          // Will be redirected by ProtectedRoute based on payment status
          navigate("/dashboard");
        }
      } else if (step === "register") {
        if (!fullName.trim()) {
          toast({
            title: t("common.error"),
            description: t("auth.fullName"),
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: t("common.error"),
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: t("auth.accountCreated"),
            description: t("common.success"),
          });
          navigate("/payment");
        }
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Calm Breath" className="w-16 h-16" />
          </div>
          <CardTitle className="text-2xl">
            {step === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}
          </CardTitle>
          <CardDescription>
            {step === "login" ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === "register" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={t("auth.fullNamePlaceholder")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={step === "register"}
                  maxLength={100}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("common.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("common.loading")}
                </>
              ) : step === "login" ? (
                t("auth.loginButton")
              ) : (
                t("auth.registerButton")
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {step === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
              <button
                type="button"
                onClick={() => setStep(step === "login" ? "register" : "login")}
                className="text-primary hover:underline font-medium"
              >
                {step === "login" ? t("auth.registerLink") : t("auth.loginLink")}
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("auth.backToHome")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
