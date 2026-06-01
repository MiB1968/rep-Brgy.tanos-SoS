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

// ---------------------------------------------------------------------------
// FIX: Decode the JWT exp claim without a library so we can reject
// already-expired tokens on hydration instead of making a failed API call.
// ---------------------------------------------------------------------------
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (typeof payload.exp !== "number") return false;
    // exp is in seconds; Date.now() is in ms
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // malformed token → treat as expired
  }
}

// ---------------------------------------------------------------------------
// FIX: Expose a module-level logout so custom-fetch.ts can call it when the
// server returns 401 (token revoked / user deleted / tokenVersion changed).
// ---------------------------------------------------------------------------
let _globalLogout: (() => void) | null = null;
export function triggerGlobalLogout() {
  _globalLogout?.();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("brgy_token");
    const storedUser = localStorage.getItem("brgy_user");

    // FIX: clear stale / expired session instead of blindly restoring it
    if (storedToken && storedUser) {
      if (isTokenExpired(storedToken)) {
        localStorage.removeItem("brgy_token");
        localStorage.removeItem("brgy_user");
      } else {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("brgy_token");
          localStorage.removeItem("brgy_user");
        }
      }
    }
    setIsHydrated(true);
  }, []);

  const logout = () => {
    localStorage.removeItem("brgy_token");
    localStorage.removeItem("brgy_user");
    setToken(null);
    setUser(null);
  };

  // Register with the module-level reference so custom-fetch can trigger it
  useEffect(() => {
    _globalLogout = logout;
    return () => { _globalLogout = null; };
  });

  const login = (newUser: AuthUser, newToken: string) => {
    localStorage.setItem("brgy_token", newToken);
    localStorage.setItem("brgy_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
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
