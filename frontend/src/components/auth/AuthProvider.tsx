"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/lib/types";
import { clearSession, getSession, getToken, setSession } from "@/lib/auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { token, user } = getSession();

    if (token && user) {
      setUserState(user);
    } else {
      clearSession();
      setUserState(null);
    }

    setLoading(false);
  }, []);

  const login = (token: string, nextUser: User) => {
    setSession(token, nextUser);
    setUserState(nextUser);
  };

  const logout = () => {
    clearSession();
    setUserState(null);
  };

  const setUser = (nextUser: User | null) => {
    if (!nextUser) {
      clearSession();
      setUserState(null);
      return;
    }

    const token = getToken();

    if (!token) {
      clearSession();
      setUserState(null);
      return;
    }

    setSession(token, nextUser);
    setUserState(nextUser);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      logout,
      setUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}