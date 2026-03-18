import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGetMe, User, AuthResponse } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  activeChildId: number | null;
  login: (data: AuthResponse) => void;
  logout: () => void;
  setActiveChildId: (id: number | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("aya_token"));
  const [activeChildId, setActiveChildIdState] = useState<number | null>(
    localStorage.getItem("aya_active_child") ? Number(localStorage.getItem("aya_active_child")) : null
  );
  const [, setLocation] = useLocation();

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    const handleExpired = () => {
      setToken(null);
      setLocation("/login");
    };
    window.addEventListener('auth-expired', handleExpired);
    return () => window.removeEventListener('auth-expired', handleExpired);
  }, [setLocation]);

  useEffect(() => {
    if (isError) {
      setToken(null);
      localStorage.removeItem("aya_token");
    }
  }, [isError]);

  const login = (data: AuthResponse) => {
    localStorage.setItem("aya_token", data.token);
    setToken(data.token);
  };

  const logout = () => {
    localStorage.removeItem("aya_token");
    localStorage.removeItem("aya_active_child");
    setToken(null);
    setActiveChildIdState(null);
    setLocation("/login");
  };

  const setActiveChildId = (id: number | null) => {
    if (id === null) {
      localStorage.removeItem("aya_active_child");
    } else {
      localStorage.setItem("aya_active_child", id.toString());
    }
    setActiveChildIdState(id);
  };

  return (
    <AuthContext.Provider value={{
      user: user || null,
      token,
      isLoading,
      activeChildId,
      login,
      logout,
      setActiveChildId
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
