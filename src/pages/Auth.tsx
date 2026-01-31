import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import logo from "@/assets/calm-breath-logo.png";
import { z } from "zod";

type AuthStep = "login" | "register" | "verify";

const Auth = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState<AuthStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, user, refreshProfile } = useAuth();

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

  const sendVerificationEmail = async (userId: string, userEmail: string, userName?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-verification-email", {
        body: { user_id: userId, email: userEmail, full_name: userName },
      });

      if (error) throw error;

      // If in dev mode (no Resend configured), show the code
      if (data?.devCode) {
        setDevCode(data.devCode);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      return { success: false, error: error.message };
    }
  };

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
        // Check if user's email is verified before allowing login
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: t("common.error"),
            description: error.message,
            variant: "destructive",
          });
        } else {
          // Check if email is verified
          const { data: profile } = await supabase
            .from("profiles")
            .select("email_verified, user_id")
            .eq("email", email)
            .maybeSingle();

          if (profile && !profile.email_verified) {
            // Sign out and show verification step
            await supabase.auth.signOut();
            setPendingUserId(profile.user_id);
            await sendVerificationEmail(profile.user_id, email);
            setStep("verify");
            toast({
              title: t("auth.verificationRequired"),
              description: t("auth.verificationSent"),
            });
          } else {
            toast({
              title: t("auth.welcomeBack"),
              description: t("common.success"),
            });
            navigate("/dashboard");
          }
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
          // Get the newly created user
          const { data: { user: newUser } } = await supabase.auth.getUser();
          
          if (newUser) {
            setPendingUserId(newUser.id);
            const result = await sendVerificationEmail(newUser.id, email, fullName);
            
            if (result.success) {
              // Sign out so user can't access app until verified
              await supabase.auth.signOut();
              setStep("verify");
              toast({
                title: t("auth.accountCreated"),
                description: t("auth.verificationSent"),
              });
            } else {
              toast({
                title: t("common.error"),
                description: t("auth.verificationError"),
                variant: "destructive",
              });
            }
          }
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

  const handleVerifyCode = async () => {
    if (!pendingUserId || verificationCode.length !== 6) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-email-code", {
        body: { user_id: pendingUserId, code: verificationCode },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: t("common.success"),
        description: t("auth.emailVerified"),
      });

      // Now user can login
      setStep("login");
      setPendingUserId(null);
      setVerificationCode("");
      setDevCode(null);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("auth.invalidCode"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingUserId) return;

    setIsLoading(true);
    try {
      const result = await sendVerificationEmail(pendingUserId, email, fullName);
      if (result.success) {
        toast({
          title: t("common.success"),
          description: t("auth.codeSent"),
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("common.error"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">{t("auth.verifyEmail")}</CardTitle>
            <CardDescription>
              {t("auth.verifyEmailDesc", { email })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {devCode && (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t("auth.devModeCode")}</p>
                  <p className="text-2xl font-mono font-bold tracking-widest">{devCode}</p>
                </div>
              )}

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={(value) => setVerificationCode(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleVerifyCode}
                className="w-full"
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("auth.verifyButton")
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("auth.noCodeReceived")}
                </p>
                <Button
                  variant="link"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-sm"
                >
                  {t("auth.resendCode")}
                </Button>
              </div>

              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep("login");
                    setPendingUserId(null);
                    setVerificationCode("");
                    setDevCode(null);
                  }}
                  className="text-sm text-muted-foreground"
                >
                  {t("auth.backToLogin")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
