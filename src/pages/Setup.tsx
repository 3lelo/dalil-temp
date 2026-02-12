import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Compass, User } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Avatar options (stored in public/assets/avatars/)
const avatars = [
  '/assets/avatars/avatar1.png',
  '/assets/avatars/avatar2.png',
  '/assets/avatars/avatar3.png',
  '/assets/avatars/avatar4.png',
  '/assets/avatars/avatar5.png',
  '/assets/avatars/avatar6.png',
  '/assets/avatars/avatar7.png',
  '/assets/avatars/avatar8.png',
];

export default function Setup() {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { t } = useI18n();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const validateUsername = (value: string): boolean => {
    const trimmed = value.trim();
    if (trimmed.length < 3 || trimmed.length > 20 || trimmed.toLowerCase().includes('admin')) {
      return false;
    }
    // Allow alphanumeric, underscores, and Arabic characters
    const pattern = /^[\u0600-\u06FFa-zA-Z0-9_]+$/;
    return pattern.test(trimmed);
  };

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .neq('id', user?.id || '')
      .maybeSingle();
    
    if (error) {
      console.error('Error checking username:', error);
      return false;
    }
    
    return data === null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedAvatar) {
      setError(t('setup.selectAvatar'));
      return;
    }

    const trimmedUsername = username.trim();
    if (!validateUsername(trimmedUsername)) {
      setError(t('setup.error.usernameInvalid'));
      return;
    }

    setIsLoading(true);

    try {
      // Check username availability
      const isAvailable = await checkUsernameAvailability(trimmedUsername);
      if (!isAvailable) {
        setError(t('setup.error.usernameTaken'));
        setIsLoading(false);
        return;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: trimmedUsername,
          avatar_url: selectedAvatar,
          onboarding_stage: 'iq',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError(t('auth.error.generic'));
        setIsLoading(false);
        return;
      }

      await refreshProfile();
      navigate('/iq', { replace: true });
    } catch (err) {
      console.error('Setup error:', err);
      setError(t('auth.error.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg animate-slide-up">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('setup.title')}</CardTitle>
          <CardDescription>{t('setup.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Selection */}
            <div className="space-y-3">
              <Label>{t('setup.selectAvatar')}</Label>
              <div className="grid grid-cols-4 gap-3">
                {avatars.map((avatar, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                      selectedAvatar === avatar
                        ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "border-border hover:border-primary/50"
                    )}
                    style={{ borderColor: 'var(--light-gray)'}}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <img src={avatar} alt="Avatar"/>
                    </div>
                    {selectedAvatar === avatar && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">{t('setup.username')}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t('setup.usernamePlaceholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {t('setup.usernameHint')}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Compass className="h-4 w-4 me-2 animate-spin" />}
              {t('setup.continue')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
