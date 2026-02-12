import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Compass, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [isChecking, setIsChecking] = useState(true);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const initRecovery = async () => {
      setIsChecking(true);

      // 1. Check if we already have a session (Supabase might have auto-set it from URL)
      const { data: { session } } = await supabase.auth.getSession();
      
      // 2. Check URL for recovery tokens (in both hash and query parameters)
      // Supabase sometimes puts tokens in hash (#) and sometimes in query (?)
      const hashParams = new URLSearchParams(location.hash.replace('#', ''));
      const queryParams = new URLSearchParams(location.search);
      
      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token') || '';
      const type = hashParams.get('type') || queryParams.get('type');
      
      const isRecoveryType = type === 'recovery' || location.state?.isRecovery;
      
      // We are in a recovery flow if:
      // a) We have an explicit recovery token in the URL or state
      // b) We OR already have a session and the URL/state indicates this is a recovery redirect
      if (isRecoveryType || (session && (location.hash.includes('type=recovery') || location.state?.isRecovery))) {
        try {
          // If we have tokens but no session yet, establish it
          if (accessToken && !session) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (cancelled) return;
            
            if (sessionError) {
              console.error('Failed to set recovery session:', sessionError);
              navigate("/docs", { replace: true });
              return;
            }
          } else if (!session && !accessToken) {
            // No session and no tokens to create one
            console.warn('Recovery type detected but no session or tokens found');
            navigate("/docs", { replace: true });
            return;
          }
          
          if (cancelled) return;
          setIsRecoveryFlow(true);
          setIsChecking(false);
          return;
        } catch (err) {
          console.error('Error in recovery initialization:', err);
          if (!cancelled) {
            navigate("/docs", { replace: true });
          }
          return;
        }
      }

      // No recovery markers found - redirect to docs
      if (!cancelled) {
        navigate("/docs", { replace: true });
      }
    };

    initRecovery();
    return () => {
      cancelled = true;
    };
  }, [navigate, location]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t("auth.error.passwordShort", "Password too short"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.error.passwordMismatch", "Passwords do not match"));
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) {
        setError(t("auth.error.generic", "Something went wrong"));
        return;
      }

      // Sign out after password change for security
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    } catch {
      setError(t("auth.error.generic", "Something went wrong"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Compass className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isRecoveryFlow) {
    // Should not happen as we redirect, but safety fallback
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("auth.reset.newTitle", "Set a new password")}</CardTitle>
          <CardDescription>{t("auth.reset.newDesc", "Enter your new password and save it.")}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password", "Password")}</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="ps-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">{t("auth.confirmPassword", "Confirm password")}</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Compass className="h-4 w-4 me-2 animate-spin" />}
              {t("auth.reset.save", "Save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
