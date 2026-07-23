import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signIn = async (email: string, password: string) => {
    setUser({ id: '1', email, name: email.split('@')[0] });
  };

  const signUp = async ({ fullName, email, phone, password, role }: SignUpPayload) => {
    setUser({ id: '1', email, name: fullName, phone, role });
  };

  const signOut = async () => {
    setUser(null);
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, isLoggedIn: !!user, signIn, signUp, signOut } },
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