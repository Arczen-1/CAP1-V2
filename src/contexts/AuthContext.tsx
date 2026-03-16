import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/api';
import { mockApi } from '@/services/mockApi';

export type UserRole = 
  | 'sales' 
  | 'accounting' 
  | 'logistics' 
  | 'banquet_supervisor' 
  | 'kitchen' 
  | 'purchasing' 
  | 'creative' 
  | 'linen' 
  | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

interface PasswordResetRequestResponse {
  message: string;
  resetCode?: string;
  expiresInMinutes?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<PasswordResetRequestResponse>;
  resetPassword: (email: string, resetCode: string, newPassword: string) => Promise<{ message: string }>;
  logout: () => void;
  isLoading: boolean;
  useMock: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      api.setToken(token);
    } else {
      api.clearToken();
    }
  }, [token]);

  const isNetworkError = (error: any) => (
    error?.message?.includes('fetch')
    || error?.message?.includes('Failed to fetch')
    || error?.name === 'TypeError'
  );

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // If auth fails, try mock
        if (response.status === 401) {
          console.warn('Backend auth failed, using mock authentication');
          setUseMock(true);
          // Get mock user from localStorage or use default
          const mockUser = JSON.parse(localStorage.getItem('mockUser') || 'null');
          if (mockUser) {
            const userWithTypedRole: User = {
              ...mockUser,
              role: mockUser.role as UserRole
            };
            setUser(userWithTypedRole);
          }
        } else {
          logout();
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      // Network error - use mock
      console.warn('Backend not available, using mock authentication');
      setUseMock(true);
      const mockUser = JSON.parse(localStorage.getItem('mockUser') || 'null');
      if (mockUser) {
        const userWithTypedRole: User = {
          ...mockUser,
          role: mockUser.role as UserRole
        };
        setUser(userWithTypedRole);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        // If backend returns auth error, try mock login
        if (response.status === 401) {
          console.warn('Backend auth failed, trying mock login');
          return mockLogin(email, password);
        }
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      setUseMock(false);
    } catch (error: any) {
      // Network error or fetch failed - use mock
      if (isNetworkError(error)) {
        console.warn('Backend not available, using mock login');
        return mockLogin(email, password);
      }
      throw error;
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      return await api.requestPasswordReset(email);
    } catch (error: any) {
      if (isNetworkError(error)) {
        console.warn('Backend not available, using mock forgot password flow');
        return mockApi.requestPasswordReset(email);
      }
      throw error;
    }
  };

  const resetPassword = async (email: string, resetCode: string, newPassword: string) => {
    try {
      return await api.resetPassword(email, resetCode, newPassword);
    } catch (error: any) {
      if (isNetworkError(error)) {
        console.warn('Backend not available, using mock password reset flow');
        return mockApi.resetPassword(email, resetCode, newPassword);
      }
      throw error;
    }
  };

  const mockLogin = async (email: string, password: string) => {
    try {
      const data = await mockApi.login(email, password);
      localStorage.setItem('mockUser', JSON.stringify(data.user));
      setToken(data.token);
      // Cast the role to UserRole to fix TypeScript error
      const userWithTypedRole: User = {
        ...data.user,
        role: data.user.role as UserRole
      };
      setUser(userWithTypedRole);
      setUseMock(true);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('mockUser');
    setToken(null);
    setUser(null);
    setUseMock(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, requestPasswordReset, resetPassword, logout, isLoading, useMock }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRole() {
  const { user } = useAuth();
  
  const hasRole = (roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const isSales = () => user?.role === 'sales' || user?.role === 'admin';
  const isAccounting = () => user?.role === 'accounting' || user?.role === 'admin';
  const isLogistics = () => user?.role === 'logistics' || user?.role === 'admin';
  const isBanquet = () => user?.role === 'banquet_supervisor' || user?.role === 'admin';
  const isKitchen = () => user?.role === 'kitchen' || user?.role === 'admin';
  const isPurchasing = () => user?.role === 'purchasing' || user?.role === 'admin';
  const isCreative = () => user?.role === 'creative' || user?.role === 'admin';
  const isLinen = () => user?.role === 'linen' || user?.role === 'admin';
  const isAdmin = () => user?.role === 'admin';

  return {
    hasRole,
    isSales,
    isAccounting,
    isLogistics,
    isBanquet,
    isKitchen,
    isPurchasing,
    isCreative,
    isLinen,
    isAdmin,
    role: user?.role
  };
}
