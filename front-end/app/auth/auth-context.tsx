import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMeRequest, signInRequest, signOutRequest, signUpRequest, type AuthUserResponse } from '../services/auth-service';
import { authExpiredEventName } from '../services/http-client';

export type AuthRole = 'guest' | 'cliente' | 'administrador';

interface AuthContextValue {
  role: AuthRole;
  email: string | null;
  token: string | null;
  user: AuthUserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (input: { email: string; password: string }) => Promise<AuthRole>;
  signUp: (input: { fullName: string; email: string; password: string }) => Promise<AuthRole>;
  updateUser: (user: AuthUserResponse) => void;
  logout: () => void;
}

interface StoredAuthState {
  token: string;
}

const STORAGE_KEY = 'ayel-auth-v3';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function parseStoredAuth(rawValue: string | null): StoredAuthState | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredAuthState>;
    if (typeof parsed.token === 'string' && parsed.token.length > 0) {
      return { token: parsed.token };
    }
  } catch {
    return null;
  }

  return null;
}

function getRoleFromUser(user: AuthUserResponse | null): AuthRole {
  if (!user) {
    return 'guest';
  }

  return user.role;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return parseStoredAuth(window.sessionStorage.getItem(STORAGE_KEY))?.token ?? null;
  });
  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(STORAGE_KEY);
      }
      setUser(null);
      setIsLoading(false);
      return;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token }));
    }

    let isMounted = true;

    async function hydrateSession() {
      try {
        const me = await getMeRequest(token);
        if (isMounted) {
          setUser(me);
        }
      } catch {
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener(authExpiredEventName, handleAuthExpired);
    return () => {
      window.removeEventListener(authExpiredEventName, handleAuthExpired);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      role: getRoleFromUser(user),
      email: user?.email ?? null,
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isLoading,
      signIn: async ({ email, password }) => {
        const response = await signInRequest({ email, password });
        setToken(response.token);
        setUser(response.user);
        return response.user.role;
      },
      signUp: async ({ fullName, email, password }) => {
        const response = await signUpRequest({ fullName, email, password });
        setToken(response.token);
        setUser(response.user);
        return response.user.role;
      },
      updateUser: (nextUser) => {
        setUser(nextUser);
      },
      logout: () => {
        const currentToken = token;
        if (currentToken) {
          void signOutRequest(currentToken).catch(() => {
            return;
          });
        }

        setToken(null);
        setUser(null);
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(STORAGE_KEY);
          window.localStorage.removeItem(STORAGE_KEY);
        }
      },
    }),
    [isLoading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
