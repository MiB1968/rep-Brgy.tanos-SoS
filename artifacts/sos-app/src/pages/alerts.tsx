import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useListAlerts, getListAlertsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const ALERT_ICONS: Record<string, string> = {
  MEDICAL: "🏥", FIRE: "🔥", CRIME: "🚔", NATURAL_DISASTER: "🌊",
  VIOLENCE: "⚠️", FLOOD: "💧", DISTURBANCE: "📢", OTHER: "🚨",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-900/40 text-amber-300 border-amber-700",
  responding: "bg-blue-900/40 text-blue-300 border-blue-700",
  resolved: "bg-green-900/40 text-green-300 border-green-700",
  cancelled: "bg-gray-700/40 text-gray-400 border-gray-600",
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
    <Layout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Alerts</h1>
            <p className="text-xs text-muted-foreground">{Array.isArray(alerts) ? alerts.length : 0} total alerts</p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-search-alerts"
              placeholder="Search alerts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
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
                    "px-3 py-1.5 text-xs rounded-md border transition-colors",
                    statusFilter === s
                      ? "bg-primary/20 border-primary/50 text-primary"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
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
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-card border border-border rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No alerts found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((a: any) => (
              <Link key={a.id} href={`/alerts/${a.id}`} data-testid={`card-alert-${a.id}`}>
                <div className="bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/40 transition-colors flex items-center gap-4">
                  <span className="text-xl flex-shrink-0">{ALERT_ICONS[a.type] ?? "🚨"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{a.type}</span>
                      <Badge className={cn("text-[10px]", STATUS_COLOR[a.status])}>{a.status?.toUpperCase()}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {a.residentName && <span>{a.residentName} · </span>}
                      {new Date(a.createdAt).toLocaleString()}
                    </div>
                    {a.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{a.description}</p>}
                  </div>
                  {a.respondedByName && (
                    <span className="text-xs text-blue-400 flex-shrink-0">Tanod: {a.respondedByName}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
