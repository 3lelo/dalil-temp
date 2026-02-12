import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Compass } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Compass className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Must be logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Must have admin or algorithm_editor role
  if (userRole !== 'admin' && userRole !== 'algorithm_editor') {
    return <Navigate to="/docs" replace />;
  }

  return <>{children}</>;
}
