import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Map, AlertTriangle, FileText, Radio,
  Users, Calendar, Activity, Settings, LogOut, Menu, X,
  Shield, Zap
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
  resident: "bg-[#00AEEF]/10 text-[#00AEEF] border-[#00AEEF]/30",
  tanod: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30",
  admin: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
  superadmin: "bg-[#FF3B5C]/10 text-[#FF3B5C] border-[#FF3B5C]/30",
};

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visible = navItems.filter(n => user && n.roles.includes(user.role));

  const sidebar = (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-[#040B1A] border-r border-[#00AEEF]/10">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#00AEEF]/10">
        <div className="w-10 h-10 rounded-xl bg-[#00AEEF]/10 border border-[#00AEEF]/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-[#00AEEF]" />
        </div>
        <div>
          <div className="text-sm font-black text-white tracking-wide font-display">BRGY TANOD</div>
          <div className="text-[10px] text-[#00F0FF] font-mono uppercase tracking-[0.2em]">S.O.S System</div>
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
                "flex items-center gap-3 px-5 py-2.5 text-sm transition-colors font-mono",
                active
                  ? "bg-[#00AEEF]/10 text-[#00F0FF] border-r-2 border-[#00F0FF] font-bold"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-[#00AEEF]/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#00AEEF]/10 border border-[#00AEEF]/20 flex items-center justify-center text-xs font-bold text-[#00F0FF] uppercase">
            {user?.name?.[0] ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name}</div>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide", roleBadgeColor[user?.role ?? "resident"])}>
              {user?.role}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          data-testid="button-logout"
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/30 hover:text-[#FF3B5C] hover:bg-[#FF3B5C]/10 rounded-md transition-colors font-mono"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-[#040B1A]">
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:h-full">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="relative flex flex-col w-64 h-full"
          >
            {sidebar}
          </motion.div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[#00AEEF]/10 bg-[#040B1A]/90 backdrop-blur-xl">
          <button onClick={() => setMobileOpen(true)} className="text-[#00F0FF] p-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/20">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00F0FF]" />
            <span className="text-sm font-black font-display text-white">Brgy Tanod SOS</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
