import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, VerifiedCustomerLocation } from '../types';
import {
  getUserByEmail,
  createUser as dbCreateUser,
  updateUser as dbUpdateUser,
} from '../services/database';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>;
  signup: (userData: Partial<User>) => Promise<void>;
  updateCustomerLocation: (location: VerifiedCustomerLocation) => Promise<void>;
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

    // Check if user exists in database
    const existingUser = getUserByEmail(email);

    if (existingUser) {
      // Validate role
      if (role && existingUser.role !== role) {
        throw new Error(`This account is registered as ${existingUser.role}. Please use the correct login page.`);
      }

      console.log('✅ [AUTH] User logged in:', existingUser.id);
      setUser(existingUser);
      return true;
    } else {
      // For demo purposes, create a new user on login if doesn't exist
      console.log('⚠️ [AUTH] User not found, creating demo account');
      
      const newUser: User = {
        id: `${role}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: role === 'customer' ? 'Demo Customer' : 'Demo Owner',
        email,
        phone: '+91 98765 43210',
        role,
        city: 'Chennai',
        locality: 'T Nagar',
      };

      dbCreateUser(newUser);
      setUser(newUser);
      console.log('✅ [AUTH] Demo user created and logged in:', newUser.id);
      return true;
    }
  };

  const signup = async (userData: Partial<User>) => {
    console.log('📝 [AUTH] Signup attempt:', userData.email, userData.role);
    console.log('📝 [AUTH] User data received:', {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      city: userData.city,
      locality: userData.locality
    });

    // Check if user already exists
    if (userData.email) {
      const existingUser = getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
    }

    const newUser: User = {
      id: `${userData.role}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      role: userData.role || 'customer',
      city: userData.city || 'Chennai',
      locality: userData.locality,
      verifiedLocation: userData.verifiedLocation,
      kycDocuments: userData.kycDocuments,
    };

    dbCreateUser(newUser);
    setUser(newUser);
    console.log('✅ [AUTH] User created successfully!');
    console.log('✅ [AUTH] Saved user info:', {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      city: newUser.city,
      locality: newUser.locality
    });
  };

  const updateCustomerLocation = async (location: VerifiedCustomerLocation) => {
    if (user && user.role === 'customer') {
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

  const logout = () => {
    console.log('👋 [AUTH] User logged out');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, updateCustomerLocation, logout }}>
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