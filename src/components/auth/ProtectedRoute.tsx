import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Compass } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, requireOnboarding = false }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Compass className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check onboarding status
  if (requireOnboarding && profile) {
    if (profile.onboarding_stage === 'profile' || !profile.username) {
      return <Navigate to="/setup" replace />;
    }
    if (profile.onboarding_stage === 'iq') {
      return <Navigate to="/iq" replace />;
    }
  }

  return <>{children}</>;
}
