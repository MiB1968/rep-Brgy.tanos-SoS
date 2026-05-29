import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListAlerts, getListAlertsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Search, Zap } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const ALERT_ICONS: Record<string, string> = {
  MEDICAL: "🏥", FIRE: "🔥", CRIME: "🚔", NATURAL_DISASTER: "🌊",
  VIOLENCE: "⚠️", FLOOD: "💧", DISTURBANCE: "📢", OTHER: "🚨",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
  responding: "bg-[#00AEEF]/10 text-[#00AEEF] border-[#00AEEF]/30",
  resolved: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30",
  cancelled: "bg-white/5 text-white/30 border-white/10",
};

export default function AlertsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const params = user?.role === "resident" ? { residentId: user.id } : statusFilter ? { status: statusFilter } : {};
  const { data: alerts = [], isLoading } = useListAlerts(params, {
    query: { queryKey: getListAlertsQueryKey(params), refetchInterval: 10000 }
  });

  const filtered = Array.isArray(alerts) ? alerts.filter((a: any) =>
    !search || a.type?.toLowerCase().includes(search.toLowerCase()) ||
    a.residentName?.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <div className="p-4 md:p-8 space-y-6 tactical-grid min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase text-white font-display flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#00F0FF]" />
            Alert Feed
          </h1>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mt-1">{Array.isArray(alerts) ? alerts.length : 0} total alerts</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            data-testid="input-search-alerts"
            placeholder="Search alerts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-[#040B1A] border-[#00F0FF]/20 text-white placeholder:text-white/20 font-mono"
          />
        </div>
        {user?.role !== "resident" && (
          <div className="flex gap-2">
            {["", "pending", "responding", "resolved", "cancelled"].map(s => (
              <button
                key={s || "all"}
                data-testid={`filter-${s || "all"}`}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 text-[10px] rounded-lg border transition-all font-black uppercase tracking-wider font-mono",
                  statusFilter === s
                    ? "bg-[#00F0FF]/10 border-[#00F0FF]/50 text-[#00F0FF]"
                    : "bg-[#040B1A] border-white/10 text-white/30 hover:text-white/60"
                )}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 tactical-panel border-white/5 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="tactical-panel border-white/5 p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/30 font-mono">No alerts found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a: any) => (
            <Link key={a.id} href={`/alerts/${a.id}`} data-testid={`card-alert-${a.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="tactical-panel border-white/5 rounded-[24px] px-4 py-3 hover:border-[#00F0FF]/40 transition-all flex items-center gap-4 cursor-pointer"
              >
                <span className="text-xl flex-shrink-0">{ALERT_ICONS[a.type] ?? "🚨"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{a.type}</span>
                    <Badge className={cn("text-[10px]", STATUS_COLOR[a.status])}>{a.status?.toUpperCase()}</Badge>
                  </div>
                  <div className="text-[10px] text-white/30 mt-0.5 font-mono">
                    {a.residentName && <span>{a.residentName} · </span>}
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                  {a.description && <p className="text-[10px] text-white/30 truncate mt-0.5">{a.description}</p>}
                </div>
                {a.respondedByName && (
                  <span className="text-[10px] text-[#00F0FF] flex-shrink-0 font-mono">T: {a.respondedByName}</span>
                )}
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
