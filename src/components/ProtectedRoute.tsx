import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  requireSuperAdmin = false 
}: ProtectedRouteProps) => {
  const { user, initialized, loading } = useAuthStore();
  const location = useLocation();

  // Wait for auth to initialize
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - redirect to auth page
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role requirements
  const roles = user.roles || [];
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const isSuperAdmin = roles.includes('super_admin');

  console.log('🛡️ ProtectedRoute check:', {
    userEmail: user.email,
    roles,
    isAdmin,
    isSuperAdmin,
    requireAdmin,
    requireSuperAdmin,
    path: location.pathname
  });

  if (requireSuperAdmin && !isSuperAdmin) {
    console.log('❌ Access denied: Super admin required');
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin) {
    console.log('❌ Access denied: Admin required');
    return <Navigate to="/" replace />;
  }

  console.log('✅ Access granted');

  return <>{children}</>;
};
