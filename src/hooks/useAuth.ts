import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setTokens, clearTokens, setUnauthorizedHandler } from '@/lib/api';

type Role = "commuter" | "driver";

type User = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role?: Role;
};

type SignUpPayload = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
};

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

const SESSION_KEY = 'auth:user';

// Backend returns { id, full_name, email, phone, role } — reshape to the
// User type the rest of the app already expects.
function toUser(apiUser: any): User {
  return {
    id: String(apiUser.id),
    email: apiUser.email,
    name: apiUser.full_name,
    phone: apiUser.phone,
    role: apiUser.role,
  };
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persist = async (nextUser: User | null) => {
    if (nextUser) {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    } else {
      await AsyncStorage.removeItem(SESSION_KEY);
    }
  };

  const signOut = async () => {
    setUser(null);
    await persist(null);
    await clearTokens();
  };

  // If a stored access token turns out to be expired/invalid and the
  // refresh fails, api.ts calls this to drop the session.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      persist(null);
    });
  }, []);

  // Restore session on launch. Trust the cached user immediately (so
  // role-based routing doesn't flash), then re-validate against /me/.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SESSION_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
          try {
            const fresh = await api.get('/auth/me/');
            const nextUser = toUser(fresh);
            setUser(nextUser);
            await persist(nextUser);
          } catch {
            // access/refresh both invalid — unauthorizedHandler already
            // cleared the session above via api.ts
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await api.post('/auth/login/', { email, password });
    await setTokens(res.access, res.refresh);
    const nextUser = toUser(res.user);
    setUser(nextUser);
    await persist(nextUser);
  };

  const signUp = async ({ fullName, email, phone, password, role }: SignUpPayload) => {
    const res = await api.post('/auth/signup/', {
      full_name: fullName,
      email,
      phone,
      password,
      role,
    });
    await setTokens(res.access, res.refresh);
    const nextUser = toUser(res.user);
    setUser(nextUser);
    await persist(nextUser);
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, isLoggedIn: !!user, isLoading, signIn, signUp, signOut } },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}