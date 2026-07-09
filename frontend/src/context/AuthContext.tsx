"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, User } from "../lib/api";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<string>;
  verifyEmail: (token: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "ecommerce_ai_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      setToken(stored);
      api
        .me(stored)
        .then(({ user }) => setUser(user))
        .catch(() => {
          window.localStorage.removeItem(STORAGE_KEY);
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function persist(token: string, user: User) {
    window.localStorage.setItem(STORAGE_KEY, token);
    setToken(token);
    setUser(user);
  }

  async function login(email: string, password: string) {
    const { token, user } = await api.login({ email, password });
    persist(token, user);
  }

  async function register(data: { email: string; password: string; firstName: string; lastName: string }) {
    const { message } = await api.register(data);
    return message;
  }

  async function verifyEmail(token: string) {
    const { token: jwt, user } = await api.verifyEmail(token);
    persist(jwt, user);
  }

  function logout() {
    window.localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, verifyEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
