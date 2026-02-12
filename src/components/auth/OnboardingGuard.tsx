import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Compass } from 'lucide-react';

interface OnboardingGuardProps {
  children: React.ReactNode;
  stage: 'setup' | 'iq';
}

export function OnboardingGuard({ children, stage }: OnboardingGuardProps) {
  const { user, profile, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Compass className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Privileged users should not access IQ test - redirect to admin panel
  if (userRole === 'admin' || userRole === 'algorithm_editor') {
    return <Navigate to="/admin" replace />;
  }

  // User already completed onboarding
  if (profile?.onboarding_stage === 'ready') {
    return <Navigate to="/dashboard" replace />;
  }

  // Setup page guard
  if (stage === 'setup') {
    // If user already has username, they should be at IQ or ready
    if (profile?.username && profile.onboarding_stage !== 'profile') {
      if (profile.onboarding_stage === 'iq') {
        return <Navigate to="/iq" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  // IQ page guard
  if (stage === 'iq') {
    // Must have completed setup first
    if (!profile?.username || profile.onboarding_stage === 'profile') {
      return <Navigate to="/setup" replace />;
    }
  }

  return <>{children}</>;
}
