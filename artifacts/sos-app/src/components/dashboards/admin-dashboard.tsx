import {
  useGetDashboardStats, getGetDashboardStatsQueryKey,
  useGetAlertsByType, getGetAlertsByTypeQueryKey,
  useGetRecentActivity, getGetRecentActivityQueryKey,
  useGetTanodPerformance, getGetTanodPerformanceQueryKey,
} from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, Users, Shield, CheckCircle, Clock, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#06b6d4", "#84cc16", "#a855f7", "#ec4899", "#14b8a6"];

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: alertsByType = [] } = useGetAlertsByType({ query: { queryKey: getGetAlertsByTypeQueryKey() } });
  const { data: recentActivity = [] } = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey() } });
  const { data: tanodPerf = [] } = useGetTanodPerformance({ query: { queryKey: getGetTanodPerformanceQueryKey() } });

  const statCards = [
    { label: "Total Alerts", value: (stats as any)?.totalAlerts ?? 0, icon: AlertTriangle, color: "text-primary" },
    { label: "Active Alerts", value: (stats as any)?.activeAlerts ?? 0, icon: Clock, color: "text-amber-400" },
    { label: "Resolved Today", value: (stats as any)?.resolvedToday ?? 0, icon: CheckCircle, color: "text-green-400" },
    { label: "Active Tanods", value: (stats as any)?.activeTanods ?? 0, icon: Shield, color: "text-blue-400" },
    { label: "Pending Users", value: (stats as any)?.pendingUsers ?? 0, icon: UserCheck, color: "text-amber-400" },
    { label: "Total Residents", value: (stats as any)?.totalResidents ?? 0, icon: Users, color: "text-cyan-400" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Command Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.name} · {user?.role}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {statCards.map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-lg p-4" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Alerts by Type</h2>
        {Array.isArray(alertsByType) && alertsByType.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={Array.isArray(alertsByType) ? alertsByType : []} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="type" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                itemStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {Array.isArray(alertsByType) && alertsByType.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Activity</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Array.isArray(recentActivity) && recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            ) : (
              Array.isArray(recentActivity) && recentActivity.slice(0, 10).map((item: any) => (
                <div key={item.id} data-testid={`activity-${item.id}`} className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <div className={cn("w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0", item.category === "alert" ? "bg-primary" : "bg-blue-400")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground line-clamp-2">{item.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tanod Performance</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Array.isArray(tanodPerf) && tanodPerf.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tanods yet</p>
            ) : (
              Array.isArray(tanodPerf) && tanodPerf.map((t: any) => (
                <div key={t.tanodId} data-testid={`perf-${t.tanodId}`} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {t.tanodName?.[0] ?? "T"}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{t.tanodName}</div>
                    <div className="text-[10px] text-muted-foreground">{t.alertsResponded} alerts · avg {t.avgResponseTimeMinutes}min</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
