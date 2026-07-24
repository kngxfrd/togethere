import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
// TODO: replace with your real backend. This in-memory map is just here
// so signIn can look up the role a user picked at signUp time — without
// it, every login would come back with role undefined and fall back to
// "commuter" in useUserRole().
const MOCK_USER_STORE: Record<string, User> = {};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session on app launch so role-based tab routing is
  // correct immediately, without waiting on a network round trip.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SESSION_KEY);
        if (stored) {
          const parsed: User = JSON.parse(stored);
          setUser(parsed);
          MOCK_USER_STORE[parsed.email] = parsed;
        }
      } catch {
        // ignore — treat as logged out
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = async (nextUser: User | null) => {
    if (nextUser) {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    } else {
      await AsyncStorage.removeItem(SESSION_KEY);
    }
  };

  // TODO: replace with your real login API call, which should return
  // the user's role from your backend rather than this local lookup.
  const signIn = async (email: string, password: string) => {
    const existing = MOCK_USER_STORE[email];
    const nextUser: User = existing ?? {
      id: '1',
      email,
      name: email.split('@')[0],
    };
    setUser(nextUser);
    MOCK_USER_STORE[email] = nextUser;
    await persist(nextUser);
  };

  const signUp = async ({ fullName, email, phone, password, role }: SignUpPayload) => {
    const nextUser: User = { id: '1', email, name: fullName, phone, role };
    setUser(nextUser);
    MOCK_USER_STORE[email] = nextUser;
    await persist(nextUser);
  };

  const signOut = async () => {
    setUser(null);
    await persist(null);
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