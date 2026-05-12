import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, VerifiedCustomerLocation } from '../types';
import {
  getUserByEmail,
  getUserById,
  createUser as dbCreateUser,
  updateUser as dbUpdateUser,
} from '../services/database';
import { hashPassword, verifyPassword } from '../utils/passwordUtils';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>;
  signup: (userData: Partial<User> & { password?: string }) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  refreshUser: () => void;
  updateCustomerLocation: (location: VerifiedCustomerLocation) => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
  becomeOwner: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'grabngo_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Restore verified location with proper date
        if (parsedUser.verifiedLocation) {
          parsedUser.verifiedLocation.verifiedAt = new Date(parsedUser.verifiedLocation.verifiedAt);
        }
        setUser(parsedUser);
        console.log('✅ [AUTH] User restored from storage:', parsedUser.id);
      } catch (error) {
        console.error('❌ [AUTH] Failed to parse saved user:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (email: string, password: string, role?: UserRole) => {
    console.log('🔐 [AUTH] Login attempt:', { email, role });

    const existingUser = getUserByEmail(email);

    if (!existingUser) {
      throw new Error('No account found with this email. Please sign up first.');
    }

    // Validate role against activeRole
    if (role && existingUser.activeRole !== role) {
      throw new Error(`This account is registered as ${existingUser.activeRole}. Please use the correct login page.`);
    }

    // Verify password
    if (existingUser.password) {
      const isValid = await verifyPassword(password, existingUser.password);
      if (!isValid) {
        throw new Error('Invalid password. Please try again.');
      }
    }

    console.log('✅ [AUTH] User logged in:', existingUser.id);
    setUser(existingUser);
    return true;
  };

  const signup = async (userData: Partial<User> & { password?: string }) => {
    console.log('📝 [AUTH] Signup attempt:', userData.email, userData.role || userData.activeRole);

    // Check if user already exists
    if (userData.email) {
      const existingUser = getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
    } else {
      throw new Error('Email is required for signup');
    }

    // Hash password
    let hashedPassword: string | undefined;
    if (userData.password) {
      hashedPassword = await hashPassword(userData.password);
    }

    const userRole = userData.role || userData.activeRole || 'customer';
    const newUser: User = {
      id: `${userRole}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      password: hashedPassword,
      // Multi-role fields
      roles: [userRole],
      activeRole: userRole,
      roleHistory: [],
      // Legacy field for backward compatibility
      role: userRole,
      city: userData.city || 'Chennai',
      locality: userData.locality,
      verifiedLocation: userData.verifiedLocation,
      kycDocuments: userData.kycDocuments,
    };

    dbCreateUser(newUser);
    setUser(newUser);
    console.log('✅ [AUTH] User created successfully:', newUser.id);
  };

  const updateCustomerLocation = async (location: VerifiedCustomerLocation) => {
    if (user && user.activeRole === 'customer') {
      const updatedUser = {
        ...user,
        verifiedLocation: location,
        locality: location.locality,
        city: location.city,
      };

      dbUpdateUser(user.id, updatedUser);
      setUser(updatedUser);
      console.log('✅ [AUTH] Customer location updated:', location.locality);
    }
  };

  /**
   * Refresh the current user from the database.
   * Call this after any external update (e.g. KYC status change)
   * so the UI reflects the latest state without a page reload.
   */
  const refreshUser = () => {
    if (!user) return;
    const latest = getUserById(user.id);
    if (latest) {
      setUser({ ...latest });
      console.log('🔄 [AUTH] User state refreshed from DB:', latest.id, 'kycStatus:', latest.customerKycStatus || latest.ownerKycStatus);
    }
  };

  const switchRole = async (newRole: UserRole) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    // Import and use roleService
    const { switchRole: switchRoleService } = await import('../services/roleService');
    const updatedUser = await switchRoleService(user, newRole);

    setUser(updatedUser);
    console.log('✅ [AUTH] Role switched:', user.activeRole, '->', newRole);
  };

  const becomeOwner = async () => {
    if (!user) {
      throw new Error('No user logged in');
    }

    // Import and use roleService
    const { becomeOwner: becomeOwnerService } = await import('../services/roleService');
    const updatedUser = await becomeOwnerService(user);

    setUser(updatedUser);
    console.log('✅ [AUTH] User became owner:', updatedUser.id);
  };

  /**
   * Reset password for existing user (forgot password flow)
   */
  const resetPassword = async (email: string, newPassword: string): Promise<void> => {
    try {
      console.log('🔐 [AUTH] Resetting password for:', email);

      const existingUser = getUserByEmail(email);
      if (!existingUser) {
        throw new Error('No account found with this email');
      }

      const hashedPassword = await hashPassword(newPassword);

      const updatedUser = {
        ...existingUser,
        password: hashedPassword,
      };

      dbUpdateUser(existingUser.id, updatedUser);
      console.log('✅ [AUTH] Password reset successfully for:', existingUser.id);
    } catch (error: any) {
      console.error('❌ [AUTH] Failed to reset password:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('👋 [AUTH] User logged out');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        resetPassword,
        refreshUser,
        updateCustomerLocation,
        switchRole,
        becomeOwner,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};