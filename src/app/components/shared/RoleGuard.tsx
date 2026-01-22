/**
 * Role-Based Access Control Guard
 * Ensures users can only access pages appropriate for their role
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  allowedRoles, 
  redirectTo 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If no user is logged in
    if (!user) {
      console.warn('⚠️ [ROLE GUARD] No user logged in, redirecting to landing page');
      navigate('/');
      return;
    }

    // If user role is not allowed
    if (!allowedRoles.includes(user.role)) {
      console.warn('⚠️ [ROLE GUARD] User role not allowed:', user.role, 'Allowed:', allowedRoles);
      
      // Redirect to appropriate home based on user role
      const roleRedirects: Record<UserRole, string> = {
        customer: '/customer/home',
        owner: '/owner/dashboard',
        admin: '/admin/dashboard',
      };

      const fallback = redirectTo || roleRedirects[user.role] || '/';
      navigate(fallback);
    }
  }, [user, allowedRoles, navigate, redirectTo]);

  // Only render if user exists and has allowed role
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};
