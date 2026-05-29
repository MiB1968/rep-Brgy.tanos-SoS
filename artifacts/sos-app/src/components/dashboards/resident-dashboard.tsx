import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { AlertTriangle, MapPin, Radio, CheckCircle } from "lucide-react";
import {
  useCreateAlert,
  useListAlerts,
  useListBroadcasts,
  getListAlertsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ALERT_TYPE_ICONS: Record<string, string> = {
  MEDICAL: "🏥", FIRE: "🔥", CRIME: "🚔", NATURAL_DISASTER: "🌊",
  VIOLENCE: "⚠️", FLOOD: "💧", DISTURBANCE: "📢", OTHER: "🚨",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-900/40 text-amber-300 border-amber-700",
  responding: "bg-blue-900/40 text-blue-300 border-blue-700",
  resolved: "bg-green-900/40 text-green-300 border-green-700",
  cancelled: "bg-gray-700/40 text-gray-400 border-gray-600",
};

export default function ResidentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const createAlert = useCreateAlert();

  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStart = useRef<number>(0);

  const { data: myAlerts = [] } = useListAlerts(
    { residentId: user?.id },
    { query: { queryKey: getListAlertsQueryKey({ residentId: user?.id }) } }
  );

  const { data: broadcasts = [] } = useListBroadcasts(
    {},
    { query: { queryKey: ["broadcasts", "active"] } }
  );

  const activeAlert = Array.isArray(myAlerts)
    ? myAlerts.find((a: any) => ["pending", "responding"].includes(a.status))
    : undefined;

  const startHold = useCallback(() => {
    if (activeAlert) return;
    setHolding(true);
    holdStart.current = Date.now();
    holdTimer.current = setInterval(() => {
      const elapsed = Date.now() - holdStart.current;
      const pct = Math.min((elapsed / 2000) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(holdTimer.current!);
        setHolding(false);
        setProgress(0);
        triggerSOS();
      }
    }, 30);
  }, [activeAlert]);

  const cancelHold = useCallback(() => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    setHolding(false);
    setProgress(0);
  }, []);

  useEffect(() => {
    return () => { if (holdTimer.current) clearInterval(holdTimer.current); };
  }, []);

  function triggerSOS() {
    const location = { lat: 14.5995, lng: 120.9842 };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        doCreate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, () => doCreate(location));
    } else doCreate(location);
  }

  function doCreate(location: { lat: number; lng: number }) {
    createAlert.mutate(
      { data: { type: "OTHER", location, description: "SOS triggered by resident" } } as any,
      {
        onSuccess: () => {
          toast({ title: "SOS Alert Sent!", description: "Tanods have been notified. Help is on the way." });
          qc.invalidateQueries({ queryKey: getListAlertsQueryKey({ residentId: user?.id }) });
        },
        onError: () => toast({ title: "Failed to send SOS", variant: "destructive" }),
      }
    );
  }

  const circumference = 2 * Math.PI * 46;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Welcome, {user?.name}</h1>
        <p className="text-sm text-muted-foreground">Barangay Emergency Response System</p>
      </div>

      <div className="flex flex-col items-center py-6">
        <div className="relative">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="46" fill="none"
              stroke="hsl(var(--primary))" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (progress / 100) * circumference}
              className="transition-all duration-100"
            />
          </svg>
          <button
            data-testid="button-sos"
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            disabled={!!activeAlert || createAlert.isPending}
            className={cn(
              "absolute inset-0 m-3 rounded-full flex flex-col items-center justify-center transition-all select-none",
              "text-white font-bold text-sm tracking-widest uppercase",
              activeAlert
                ? "bg-amber-600/30 border-2 border-amber-500 cursor-not-allowed"
                : holding
                ? "bg-primary/80 scale-95 shadow-[0_0_30px_hsl(var(--primary)/0.6)]"
                : "bg-primary hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.4)] active:scale-95",
              "animate-pulse-slow"
            )}
          >
            {activeAlert ? (
              <>
                <AlertTriangle className="w-6 h-6 mb-1" />
                <span className="text-xs">ACTIVE</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-black">SOS</span>
                <span className="text-[9px] opacity-70">{holding ? "HOLD..." : "HOLD 2s"}</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {activeAlert ? "Alert is active — tanods notified" : "Hold button for 2 seconds to send emergency alert"}
        </p>
      </div>

      {activeAlert && (
        <div
          data-testid="status-active-alert"
          className="bg-card border border-amber-700/50 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-semibold text-amber-300">Active Alert</span>
            <Badge className={cn("ml-auto text-[10px]", STATUS_COLOR[activeAlert.status as string])}>{(activeAlert as any).status?.toUpperCase()}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{ALERT_TYPE_ICONS[(activeAlert as any).type]} {(activeAlert as any).type}</p>
          {(activeAlert as any).respondedByName && (
            <p className="text-xs text-green-400 mt-1">Tanod {(activeAlert as any).respondedByName} is responding</p>
          )}
          <Link href={`/alerts/${(activeAlert as any).id}`} className="text-xs text-primary hover:underline mt-2 block">View details</Link>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">My Recent Alerts</h2>
        {Array.isArray(myAlerts) && myAlerts.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center text-sm text-muted-foreground">No alerts yet</div>
        ) : (
          <div className="space-y-2">
            {Array.isArray(myAlerts) && myAlerts.slice(0, 5).map((a: any) => (
              <Link key={a.id} href={`/alerts/${a.id}`} data-testid={`card-alert-${a.id}`}>
                <div className="bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/40 transition-colors flex items-center gap-3">
                  <span className="text-base">{ALERT_TYPE_ICONS[a.type] ?? "🚨"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{a.type}</div>
                    <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                  <Badge className={cn("text-[10px]", STATUS_COLOR[a.status])}>{a.status?.toUpperCase()}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Active Broadcasts</h2>
        {Array.isArray(broadcasts) && broadcasts.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-4 text-center text-sm text-muted-foreground">No active broadcasts</div>
        ) : (
          <div className="space-y-2">
            {Array.isArray(broadcasts) && broadcasts.slice(0, 3).map((b: any) => (
              <div key={b.id} data-testid={`card-broadcast-${b.id}`} className="bg-card border border-primary/20 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Radio className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-primary uppercase">{b.type ?? "broadcast"}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{new Date(b.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-foreground">{b.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
