import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Map, AlertTriangle, FileText, Radio,
  Users, Calendar, Activity, Settings, LogOut, Menu, X,
  Shield
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["resident", "tanod", "admin", "superadmin"] },
  { path: "/map", icon: Map, label: "Live Map", roles: ["resident", "tanod", "admin", "superadmin"] },
  { path: "/alerts", icon: AlertTriangle, label: "Alerts", roles: ["resident", "tanod", "admin", "superadmin"] },
  { path: "/incidents", icon: FileText, label: "Incidents", roles: ["tanod", "admin", "superadmin"] },
  { path: "/broadcasts", icon: Radio, label: "Broadcasts", roles: ["resident", "tanod", "admin", "superadmin"] },
  { path: "/shifts", icon: Calendar, label: "Shifts", roles: ["tanod", "admin", "superadmin"] },
  { path: "/activity", icon: Activity, label: "Activity", roles: ["tanod", "admin", "superadmin"] },
  { path: "/users", icon: Users, label: "Users", roles: ["admin", "superadmin"] },
  { path: "/settings", icon: Settings, label: "Settings", roles: ["resident", "tanod", "admin", "superadmin"] },
];

const roleBadgeColor: Record<string, string> = {
  resident: "bg-blue-900/50 text-blue-300 border-blue-700",
  tanod: "bg-green-900/50 text-green-300 border-green-700",
  admin: "bg-amber-900/50 text-amber-300 border-amber-700",
  superadmin: "bg-primary/20 text-primary border-primary/50",
};

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visible = navItems.filter(n => user && n.roles.includes(user.role));

  const sidebar = (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-sm font-bold text-foreground tracking-wide">BRGY TANOD</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">S.O.S System</div>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {visible.map(item => {
          const active = location === item.path || location.startsWith(item.path + "/");
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMobileOpen(false)}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
              className={cn(
                "flex items-center gap-3 px-5 py-2.5 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary border-r-2 border-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground uppercase">
            {user?.name?.[0] ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{user?.name}</div>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide", roleBadgeColor[user?.role ?? "resident"])}>
              {user?.role}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          data-testid="button-logout"
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:h-full">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative flex flex-col w-64 h-full">{sidebar}</div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Brgy Tanod SOS</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
