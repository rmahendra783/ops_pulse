import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "../lib/api";

export interface Organization {
  id: number;
  name: string;
  subdomain: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: "admin" | "agent" | "customer";
  organization: Organization;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  signup: (payload: {
    user: { email: string; password: string; password_confirmation: string; first_name: string; last_name: string };
    organization: { name: string; subdomain: string };
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("opspulse_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get<{ user: User }>("/me");
      setUser(res.data.user);
    } catch {
      localStorage.removeItem("opspulse_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post("/auth/login", { user: credentials });
    setUser(res.data.data.user || res.data.data);
  };

  const signup = async (payload: {
    user: { email: string; password: string; password_confirmation: string; first_name: string; last_name: string };
    organization: { name: string; subdomain: string };
  }) => {
    const res = await apiClient.post("/auth/signup", payload);
    setUser(res.data.data.user || res.data.data);
  };

  const logout = async () => {
    try {
      await apiClient.delete("/auth/logout");
    } finally {
      localStorage.removeItem("opspulse_token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};