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
  signIn: (input: { email: string; password: string; rememberSession: boolean }) => Promise<AuthRole>;
  signUp: (input: { fullName: string; email: string; password: string }) => Promise<AuthRole>;
  updateUser: (user: AuthUserResponse) => void;
  logout: () => void;
}

interface StoredAuthState {
  token: string;
  persistOnDevice: boolean;
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
      return { token: parsed.token, persistOnDevice: false };
    }
  } catch {
    return null;
  }

  return null;
}

function readStoredAuthState() {
  if (typeof window === 'undefined') {
    return null;
  }

  const fromLocalStorage = parseStoredAuth(window.localStorage.getItem(STORAGE_KEY));
  if (fromLocalStorage) {
    return { token: fromLocalStorage.token, persistOnDevice: true };
  }

  const fromSessionStorage = parseStoredAuth(window.sessionStorage.getItem(STORAGE_KEY));
  if (fromSessionStorage) {
    return { token: fromSessionStorage.token, persistOnDevice: false };
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
  const [storedAuthState, setStoredAuthState] = useState<StoredAuthState | null>(() => readStoredAuthState());
  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const token = storedAuthState?.token ?? null;

  useEffect(() => {
    if (!storedAuthState) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(STORAGE_KEY);
      }
      setUser(null);
      setIsLoading(false);
      return;
    }

    if (typeof window !== 'undefined') {
      const payload = JSON.stringify({ token: storedAuthState.token });
      if (storedAuthState.persistOnDevice) {
        window.localStorage.setItem(STORAGE_KEY, payload);
        window.sessionStorage.removeItem(STORAGE_KEY);
      } else {
        window.sessionStorage.setItem(STORAGE_KEY, payload);
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    let isMounted = true;

    async function hydrateSession() {
      try {
        const me = await getMeRequest(storedAuthState.token);
        if (isMounted) {
          setUser(me);
        }
      } catch {
        if (isMounted) {
          setStoredAuthState(null);
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
  }, [storedAuthState]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleAuthExpired = () => {
      setStoredAuthState(null);
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
      signIn: async ({ email, password, rememberSession }) => {
        const response = await signInRequest({ email, password });
        setStoredAuthState({ token: response.token, persistOnDevice: rememberSession });
        setUser(response.user);
        return response.user.role;
      },
      signUp: async ({ fullName, email, password }) => {
        const response = await signUpRequest({ fullName, email, password });
        setStoredAuthState({ token: response.token, persistOnDevice: false });
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

        setStoredAuthState(null);
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
