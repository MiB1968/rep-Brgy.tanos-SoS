import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "resident" | "tanod" | "admin" | "superadmin";
  status: string;
  phone?: string | null;
  address?: string | null;
  barangayId?: string | null;
  createdAt?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("brgy_token");
    const storedUser = localStorage.getItem("brgy_user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("brgy_token");
        localStorage.removeItem("brgy_user");
      }
    }
    setIsHydrated(true);
  }, []);

  const login = (newUser: AuthUser, newToken: string) => {
    localStorage.setItem("brgy_token", newToken);
    localStorage.setItem("brgy_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("brgy_token");
    localStorage.removeItem("brgy_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isHydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
