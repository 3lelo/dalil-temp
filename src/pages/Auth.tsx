import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Compass } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";

const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);

type Mode = "signin" | "signup" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [error, setError] = useState("");

  const { t } = useI18n();
  const { signIn, signUp, user, profile, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      if (userRole === 'admin' || userRole === 'algorithm_editor') {
        navigate("/admin", { replace: true });
        return;
      }
      if (profile.onboarding_stage === "profile" || !profile.username) {
        navigate("/setup", { replace: true });
      } else if (profile.onboarding_stage === "iq") {
        navigate("/iq", { replace: true });
      } else {
        const from = (location.state as any)?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      }
    }
  }, [user, profile, userRole, navigate, location]);

  const validateEmailPassword = (): boolean => {
    setError("");

    try {
      emailSchema.parse(email);
    } catch {
      setError(t("auth.error.invalidEmail"));
      return false;
    }

    // in forgot mode, we only need email
    if (mode === "forgot") return true;

    try {
      passwordSchema.parse(password);
    } catch {
      setError(t("auth.error.passwordShort"));
      return false;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError(t("auth.error.passwordMismatch"));
      return false;
    }

    return true;
  };

const handleForgotPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setIsLoading(true);

  try {
    const cleanEmail = email.trim().toLowerCase();

    const { data: exists, error: existsError } = await supabase.rpc(
      "email_exists_for_reset",
      { p_email: cleanEmail }
    );

    if (existsError) {
      console.error("email_exists_for_reset error:", existsError);
      setError(t("auth.error.generic"));
      return;
    }

    if (!exists) {
      setError(t("auth.reset.notFound", "هذا البريد غير مسجل لدينا"));
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      console.error("resetPasswordForEmail error:", resetError);
      setError(t("auth.error.generic"));
      return;
    }

    alert(
      t("auth.reset.sent") + "\n\n" + t("auth.spamNote")
    );
    setMode("signin");
  } catch (err) {
    console.error("handleForgotPassword error:", err);
    setError(t("auth.error.generic"));
  } finally {
    setIsLoading(false);
  }
};

  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmailPassword()) return;

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (mode === "signup") {
        const { data: exists, error: existsError } = await supabase.rpc(
          "email_exists_for_reset",
          { p_email: cleanEmail }
        );

        if (existsError) {
          console.error("email_exists_for_reset error:", existsError);
          setError(`${t("auth.error.generic")}: ${existsError.message}`);
          return;
        }

        if (exists) {
          setError(t("auth.error.userExists"));
          return;
        }
      }

      const { error: authError } =
        mode === "signin"
          ? await signIn(cleanEmail, password)
          : await signUp(cleanEmail, password);

      if (authError) {
        // Handle specific error messages
        const errorMsg = authError.message.toLowerCase();

        if (errorMsg.includes("user already registered") || errorMsg.includes("already been registered")) {
          setError(t("auth.error.userExists"));
        } else if (errorMsg.includes("invalid login credentials")) {
          setError(t("auth.error.invalidCredentials"));
        } else if (errorMsg.includes("email rate limit exceeded") || errorMsg.includes("too many requests") || errorMsg.includes("429")) {
          setError(t("auth.error.rateLimited"));
        } else if (errorMsg.includes("email not confirmed")) {
          setError(t("auth.error.emailNotConfirmed"));
        } else if (errorMsg.includes("invalid email")) {
          setError(t("auth.error.invalidEmail"));
        } else if (errorMsg.includes("password")) {
          setError(t("auth.error.passwordIssue"));
        } else {
          // Show the actual error message for debugging
          setError(`${t("auth.error.generic")}: ${authError.message}`);
        }
      } else if (mode === "signup") {
        // Show success message for signup
        setSuccessMessage(t("auth.signup.success") + " " + t("auth.spamNote"));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`${t("auth.error.generic", "حدث خطأ")}: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Main Hero Logo Icon
  const MainHeroLogoIcon = () => (
    <svg
      className="logo-icon animate-spin-slow"
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );

  const title =
    mode === "signin"
      ? t("auth.signin")
      : mode === "signup"
      ? t("auth.signup")
      : t("auth.reset.title", "استعادة كلمة المرور");

  const submitText =
    mode === "signin"
      ? t("auth.signinButton")
      : mode === "signup"
      ? t("auth.signupButton")
      : t("auth.reset.send", "إرسال رابط الاستعادة");

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-slide-up">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <MainHeroLogoIcon />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{t("app.tagline")}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={mode === "forgot" ? handleForgotPassword : handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ps-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password fields (hidden in forgot mode) */}
            {mode !== "forgot" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="ps-10 pe-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Forgot password link (signin only) */}
                  {mode === "signin" && (
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot");
                          setError("");
                        }}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        {t("auth.forgotPassword", "نسيت كلمة المرور؟")}
                      </button>
                    </div>
                  )}
                </div>

                {/* Confirm Password (signup only) */}
                {mode === "signup" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                      <div className="relative">
                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="ps-10"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="flex items-start space-x-2 rtl:space-x-reverse pt-2">
                      <Checkbox 
                        id="terms" 
                        checked={isAgreed} 
                        onCheckedChange={(checked) => setIsAgreed(checked === true)}
                        disabled={isLoading}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="terms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {t("auth.agreeTerms")}
                        </label>
                        <div className="flex gap-2 text-xs text-primary">
                          <Link to="/terms" className="hover:underline">{t("footer.terms")}</Link>
                          <span>•</span>
                          <Link to="/privacy" className="hover:underline">{t("footer.privacy")}</Link>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            {/* Success */}
            {successMessage && (
              <div className="p-3 rounded-lg bg-primary/10 text-primary text-sm">{successMessage}</div>
            )}

            {/* Submit */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || (mode === "signup" && !isAgreed)}
            >
              {isLoading && <Compass className="h-4 w-4 me-2 animate-spin" />}
              {submitText}
            </Button>

            {/* Google Sign In (Coming Soon) */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t('auth.orContinueWith', 'Or continue with')}
                </span>
              </div>
            </div>

            <Button variant="outline" type="button" className="w-full relative" disabled>
              <svg className="h-4 w-4 me-2 bg-white rounded-full" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
              <span className="absolute end-2 bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                {t('common.comingSoon', 'Coming Soon')}
              </span>
            </Button>
          </form>

          {/* Mode switchers */}
          <div className="mt-6 text-center text-sm">
            {mode === "signin" && (
              <p className="text-muted-foreground">
                {t("auth.noAccount")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {t("auth.signup")}
                </button>
              </p>
            )}

            {mode === "signup" && (
              <p className="text-muted-foreground">
                {t("auth.hasAccount")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {t("auth.signin")}
                </button>
              </p>
            )}

            {mode === "forgot" && (
              <p className="text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {t("auth.backToSignin", "العودة لتسجيل الدخول")}
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
