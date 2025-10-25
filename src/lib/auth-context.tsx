'use client';

import { SessionUser } from '@/types/user';
import { signIn, signOut, useSession } from 'next-auth/react';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: SessionUser | null;
  login: (name: string, email: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(status === 'loading');
  }, [status]);

  const login = async (name: string, email: string) => {
    try {
      const result = await signIn('credentials', {
        name,
        email,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    signOut({ redirect: false });
  };

  const user: SessionUser | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
      }
    : null;

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
