import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGetMe, User, AuthResponse, getGetMeQueryKey, logout as apiLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  activeChildId: number | null;
  login: (data: AuthResponse) => void;
  logout: () => void;
  setActiveChildId: (id: number | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("aya_token"));
  const [activeChildId, setActiveChildIdState] = useState<number | null>(
    localStorage.getItem("aya_active_child") ? Number(localStorage.getItem("aya_active_child")) : null
  );
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      // Prevent aggressive refetches that cause false logouts on transient errors
      retry: false,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  });

  useEffect(() => {
    const handleExpired = () => {
      // Real 401 on a core API route — the fetch interceptor dispatches this.
      // NOTE: Voice/TTS routes are excluded from dispatching this event (see fetch-interceptor.ts).
      // This only fires for real auth failures on chat, missions, auth/me, etc.
      const currentPath = window.location.pathname;
      console.warn("[AUTH] auth-expired event received — core API returned 401", {
        reason: "server rejected token on a core route",
        currentPath,
        action: "clearing token and redirecting to /login",
      });
      setToken(null);
      setLocation("/login");
    };
    window.addEventListener('auth-expired', handleExpired);
    return () => window.removeEventListener('auth-expired', handleExpired);
  }, [setLocation]);

  // NOTE: isError from useGetMe is intentionally NOT used to clear the token.
  // The fetch interceptor is the single source of truth for real auth failures (401).
  // Clearing the token on any query error (network hiccup, 500, timeout) would
  // cause false logouts during voice mode, TTS failures, and transient server errors.

  const login = (data: AuthResponse) => {
    localStorage.setItem("aya_token", data.token);
    setToken(data.token);
    setLocation("/dashboard");
  };

  const logout = () => {
    apiLogout().catch(() => { /* ignore server errors on logout */ });
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

  const refreshUser = async () => {
    await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  return (
    <AuthContext.Provider value={{
      user: user || null,
      token,
      isLoading,
      activeChildId,
      login,
      logout,
      setActiveChildId,
      refreshUser,
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
