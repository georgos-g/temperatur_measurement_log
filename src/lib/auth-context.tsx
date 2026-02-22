'use client';

import { SessionUser } from '@/types/user';
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: SessionUser | null;
  login: (name: string, email: string) => Promise<void>;
  loginWithProvider: (provider: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [dbUser, setDbUser] = useState<SessionUser | null>(null);
  const [isLoadingDbUser, setIsLoadingDbUser] = useState(false);

  // Fetch database user when Clerk user is available
  useEffect(() => {
    async function fetchDbUser() {
      if (isSignedIn && clerkUser) {
        setIsLoadingDbUser(true);
        try {
          const response = await fetch('/api/user');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              setDbUser({
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
              });
            }
          } else {
            // Fallback to Clerk user data if API fails
            setDbUser({
              id: clerkUser.id,
              name: clerkUser.fullName || clerkUser.firstName || '',
              email: clerkUser.emailAddresses[0]?.emailAddress || '',
            });
          }
        } catch (error) {
          console.error('Error fetching database user:', error);
          // Fallback to Clerk user data
          setDbUser({
            id: clerkUser.id,
            name: clerkUser.fullName || clerkUser.firstName || '',
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
          });
        } finally {
          setIsLoadingDbUser(false);
        }
      } else {
        setDbUser(null);
      }
    }

    if (isLoaded) {
      fetchDbUser();
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  // Login function - with Clerk, this redirects to the Clerk sign-in page
  const login = async (_name: string, _email: string) => {
    // Clerk handles auth through its own UI/components
    // This is kept for API compatibility but redirects to Clerk sign-in
    window.location.href = '/sign-in';
  };

  // Provider login - redirects to Clerk with specific provider
  const loginWithProvider = async (_provider: string) => {
    // Clerk handles OAuth through its sign-in page
    window.location.href = `/sign-in?redirect_url=/`;
  };

  const logout = () => {
    setDbUser(null);
    signOut({ redirectUrl: '/' });
  };

  return (
    <AuthContext.Provider
      value={{
        user: dbUser,
        login,
        loginWithProvider,
        logout,
        isLoading: !isLoaded || isLoadingDbUser,
      }}
    >
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
