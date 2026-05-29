import { Link } from "wouter";
import { Shield, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import {
  useListAlerts, getListAlertsQueryKey,
  useListIncidents, getListIncidentsQueryKey,
  useListShifts, getListShiftsQueryKey,
  useGetMyPatrol, getGetMyPatrolQueryKey,
  useUpdateMyPatrol,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-900/40 text-amber-300 border-amber-700",
  responding: "bg-blue-900/40 text-blue-300 border-blue-700",
  resolved: "bg-green-900/40 text-green-300 border-green-700",
  cancelled: "bg-gray-700/40 text-gray-400 border-gray-600",
};

const ALERT_ICONS: Record<string, string> = {
  MEDICAL: "🏥", FIRE: "🔥", CRIME: "🚔", NATURAL_DISASTER: "🌊",
  VIOLENCE: "⚠️", FLOOD: "💧", DISTURBANCE: "📢", OTHER: "🚨",
};

export default function TanodDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: patrol } = useGetMyPatrol({ query: { queryKey: getGetMyPatrolQueryKey() } });
  const updatePatrol = useUpdateMyPatrol();

  const { data: alerts = [] } = useListAlerts(
    { status: "pending,responding" },
    { query: { queryKey: getListAlertsQueryKey({ status: "pending,responding" }) } }
  );

  const { data: myIncidents = [] } = useListIncidents(
    {},
    { query: { queryKey: getListIncidentsQueryKey({}) } }
  );

  const { data: shifts = [] } = useListShifts(
    {},
    { query: { queryKey: getListShiftsQueryKey({}) } }
  );

  const isOnDuty = (patrol as any)?.isActive ?? false;

  function toggleDuty() {
    const newStatus = !isOnDuty;
    updatePatrol.mutate(
      { data: { isActive: newStatus, status: newStatus ? "patrolling" : "offline" } } as any,
      {
        onSuccess: () => {
          toast({ title: newStatus ? "Now On Duty" : "Off Duty", description: newStatus ? "You are now visible to admin" : "Patrol status updated" });
          qc.invalidateQueries({ queryKey: getGetMyPatrolQueryKey() });
        },
      }
    );
  }

  const upcomingShifts = Array.isArray(shifts)
    ? shifts.filter((s: any) => s.status === "scheduled").slice(0, 3)
    : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Tanod Panel</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.name}</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Patrol Status</p>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isOnDuty ? "bg-green-400 animate-pulse" : "bg-gray-500")} />
              <span className="font-semibold text-foreground">{isOnDuty ? "On Duty" : "Off Duty"}</span>
            </div>
          </div>
          <button
            data-testid="button-toggle-duty"
            onClick={toggleDuty}
            disabled={updatePatrol.isPending}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-semibold transition-colors",
              isOnDuty
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {isOnDuty ? "Go Off Duty" : "Go On Duty"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Alerts", value: Array.isArray(alerts) ? alerts.length : 0, color: "text-amber-300" },
          { label: "My Incidents", value: Array.isArray(myIncidents) ? myIncidents.length : 0, color: "text-blue-300" },
          { label: "Upcoming Shifts", value: upcomingShifts.length, color: "text-green-300" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-lg p-4 text-center">
            <div className={cn("text-2xl font-bold", stat.color)} data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>{stat.value}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Active Alerts</h2>
        {Array.isArray(alerts) && alerts.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center text-sm text-muted-foreground">No active alerts</div>
        ) : (
          <div className="space-y-2">
            {Array.isArray(alerts) && alerts.slice(0, 5).map((a: any) => (
              <Link key={a.id} href={`/alerts/${a.id}`} data-testid={`card-alert-${a.id}`}>
                <div className="bg-card border border-amber-700/30 rounded-lg px-4 py-3 hover:border-primary/40 transition-colors flex items-center gap-3">
                  <span className="text-base">{ALERT_ICONS[a.type] ?? "🚨"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{a.type}</div>
                    <div className="text-xs text-muted-foreground">{a.residentName} · {new Date(a.createdAt).toLocaleTimeString()}</div>
                  </div>
                  <Badge className={cn("text-[10px]", STATUS_COLOR[a.status])}>{a.status?.toUpperCase()}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Upcoming Shifts</h2>
        {upcomingShifts.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-4 text-center text-sm text-muted-foreground">No upcoming shifts</div>
        ) : (
          <div className="space-y-2">
            {upcomingShifts.map((s: any) => (
              <div key={s.id} data-testid={`card-shift-${s.id}`} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{s.sector}</div>
                  <div className="text-xs text-muted-foreground">{new Date(s.startTime).toLocaleString()} – {new Date(s.endTime).toLocaleTimeString()}</div>
                </div>
                <Badge className="bg-green-900/40 text-green-300 border-green-700 text-[10px]">Scheduled</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
