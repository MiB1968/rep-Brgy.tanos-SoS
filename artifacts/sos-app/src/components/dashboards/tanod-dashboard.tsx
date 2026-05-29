import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Shield, AlertTriangle, CheckCircle, Calendar, Zap, Map as MapIcon,
  Activity, Radio, PhoneCall, Cpu, Settings, Grid, Eye, Clock
} from "lucide-react";
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
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
          toast({ title: newStatus ? "🟢 Now On Duty" : "⚫ Off Duty", description: newStatus ? "You are visible to admin dispatch" : "Patrol status updated" });
          qc.invalidateQueries({ queryKey: getGetMyPatrolQueryKey() });
        },
      }
    );
  }

  const upcomingShifts = Array.isArray(shifts)
    ? shifts.filter((s: any) => s.status === "scheduled").slice(0, 3)
    : [];

  const activeAlerts = Array.isArray(alerts) ? alerts.filter((a: any) => a.status === "pending").length : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 md:space-y-8 pb-20 tactical-grid min-h-screen p-4 md:p-8"
    >
      {/* Hero Header */}
      <motion.div
        variants={itemVariants}
        className="relative tactical-panel p-6 sm:p-8 rounded-[32px] border border-[#00F0FF]/20 shadow-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#040B1A] via-transparent to-[#00AEEF]/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse shadow-[0_0_8px_#00F0FF]" />
              <span className="text-[9px] font-mono text-[#00F0FF] font-black uppercase tracking-[0.4em]">Tactical Responder Uplink Active</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-black italic tracking-tighter uppercase text-white font-display leading-none flex items-center gap-3">
              <Shield className="w-7 h-7 sm:w-10 sm:h-10 text-[#00AEEF]" />
              <span>TANOD</span><span className="text-[#00AEEF]">PORTAL</span>
            </h2>
            <p className="text-[9px] sm:text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] mt-3 bg-white/5 inline-block px-3 py-1 rounded-full border border-white/10">Security Force Terminal</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border",
              isOnDuty ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30" : "bg-white/5 text-white/40 border-white/10"
            )}>
              {isOnDuty ? "ON DUTY" : "OFF DUTY"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Duty Toggle */}
      <motion.div variants={itemVariants} className="tactical-panel border-white/5 rounded-[32px] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mb-1">Patrol Status</p>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isOnDuty ? "bg-[#10B981] animate-pulse shadow-[0_0_8px_#10B981]" : "bg-[#94A3B8]")} />
              <span className="text-sm font-black text-white tracking-wide">{isOnDuty ? "ON DUTY" : "OFF DUTY"}</span>
            </div>
          </div>
          <button
            data-testid="button-toggle-duty"
            onClick={toggleDuty}
            disabled={updatePatrol.isPending}
            className={cn(
              "px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all border",
              isOnDuty
                ? "bg-[#040B1A] border-[#FF3B5C]/30 text-[#FF3B5C] hover:bg-[#FF3B5C]/10 hover:border-[#FF3B5C]/50"
                : "bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 hover:border-[#00F0FF]/50"
            )}
          >
            {updatePatrol.isPending ? "..." : isOnDuty ? "Go Off Duty" : "Go On Duty"}
          </button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Alerts", value: activeAlerts, color: "text-[#F59E0B]", border: "border-[#F59E0B]/20" },
          { label: "My Incidents", value: Array.isArray(myIncidents) ? myIncidents.length : 0, color: "text-[#00AEEF]", border: "border-[#00AEEF]/20" },
          { label: "Upcoming Shifts", value: upcomingShifts.length, color: "text-[#10B981]", border: "border-[#10B981]/20" },
        ].map(stat => (
          <div key={stat.label} className={cn("tactical-panel p-4 text-center border", stat.border)} data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
            <div className={cn("text-3xl font-black italic tracking-tighter font-display", stat.color)}>{stat.value}</div>
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT - ALERTS FEED */}
        <div className="w-full lg:w-[420px] flex-shrink-0 space-y-4">
          <motion.div variants={itemVariants} className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#FF3B5C] font-mono italic">Active Alerts Feed</h3>
            {Array.isArray(alerts) && alerts.length === 0 ? (
              <div className="tactical-panel border border-white/5 rounded-[32px] p-6 text-center text-sm text-white/40">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-white/20" />
                No active alerts
              </div>
            ) : (
              <div className="space-y-2">
                {Array.isArray(alerts) && alerts.slice(0, 5).map((a: any) => (
                  <Link key={a.id} href={`/alerts/${a.id}`} data-testid={`card-alert-${a.id}`}>
                    <div className="tactical-panel border border-[#F59E0B]/20 rounded-[24px] px-4 py-3 hover:border-[#00F0FF]/40 transition-all flex items-center gap-3 cursor-pointer">
                      <span className="text-lg">{ALERT_ICONS[a.type] ?? "🚨"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{a.type}</div>
                        <div className="text-[10px] text-white/30">{a.residentName} · {new Date(a.createdAt).toLocaleTimeString()}</div>
                      </div>
                      <Badge className={cn("text-[10px]", STATUS_COLOR[a.status])}>{a.status?.toUpperCase()}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Upcoming Shifts */}
          <motion.div variants={itemVariants} className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00F0FF] font-mono italic">Upcoming Shifts</h3>
            {upcomingShifts.length === 0 ? (
              <div className="tactical-panel border border-white/5 rounded-[32px] p-4 text-center text-sm text-white/40">
                <Calendar className="w-5 h-5 mx-auto mb-2 text-white/20" />
                No upcoming shifts
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingShifts.map((s: any) => (
                  <div key={s.id} className="tactical-panel border border-white/5 rounded-[24px] px-4 py-3 flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[#00F0FF] flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{s.sector}</div>
                      <div className="text-[10px] text-white/30">{new Date(s.startTime).toLocaleString()} – {new Date(s.endTime).toLocaleTimeString()}</div>
                    </div>
                    <Badge className="bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30 text-[10px]">Scheduled</Badge>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* CENTER - TACTICAL CONSOLE */}
        <div className="flex-1 w-full space-y-6">
          <motion.div variants={itemVariants} className="tactical-panel border-[#00F0FF]/20 p-5 md:p-6 rounded-[32px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00F0FF]/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div>
                <span className="text-[8px] font-black tracking-widest text-[#00F0FF] font-mono uppercase">PATROL_HUD_MATRIX</span>
                <h3 className="text-sm font-black uppercase tracking-wider font-display text-white mt-0.5 flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-[#00F0FF] animate-pulse" />
                  TACTICAL RESPONDER GRID
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "map", label: "Intel Livemap", icon: MapIcon, desc: "Community Grid", color: "text-[#00F0FF] border-[#00F0FF]/10 hover:bg-[#00F0FF]/5 hover:border-[#00F0FF]/40" },
                { id: "alerts", label: "Alert Feed", icon: AlertTriangle, desc: "Active SOS", color: "text-[#F59E0B] border-[#F59E0B]/10 hover:bg-[#F59E0B]/5 hover:border-[#F59E0B]/40" },
                { id: "shifts", label: "Shift Schedule", icon: Calendar, desc: "Planning", color: "text-[#6366F1] border-[#6366F1]/10 hover:bg-[#6366F1]/5 hover:border-[#6366F1]/40" },
                { id: "broadcasts", label: "Threat Feeds", icon: Radio, desc: "Broadcasts", color: "text-[#FF3B5C] border-[#FF3B5C]/10 hover:bg-[#FF3B5C]/5 hover:border-[#FF3B5C]/40" },
                { id: "incidents", label: "Incident Log", icon: Eye, desc: "Reports", color: "text-[#A855F7] border-[#A855F7]/10 hover:bg-[#A855F7]/5 hover:border-[#A855F7]/40" },
                { id: "settings", label: "Profile Config", icon: Settings, desc: "Settings", color: "text-[#94A3B8] border-[#94A3B8]/10 hover:bg-[#94A3B8]/5 hover:border-[#94A3B8]/40" }
              ].map((mod) => {
                const Icon = mod.icon;
                return (
                  <Link key={mod.id} href={`/${mod.id}`}>
                    <button className={`flex flex-col text-left p-3 rounded-2xl border bg-black/40 transition-all active:scale-95 duration-300 hover:scale-[1.03] hover:shadow-md select-none group cursor-pointer w-full ${mod.color}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 ml-0 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                          <Icon className="w-4 h-4 text-white/70 group-hover:text-white" />
                        </div>
                      </div>
                      <h4 className="text-[10px] font-black uppercase font-mono tracking-wider italic text-white/90 leading-tight group-hover:text-white transition-colors">{mod.label}</h4>
                      <p className="text-[8px] font-bold text-white/30 tracking-tight leading-normal mt-1 font-mono">{mod.desc}</p>
                    </button>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Performance Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
            <div className="tactical-panel border-[#00F0FF]/20 p-4 rounded-[24px]">
              <div className="flex justify-between items-center p-3 bg-[#040B1A] rounded-2xl border border-[#00F0FF]/20">
                <span className="text-[11px] font-bold text-white/60 font-mono">Active Patrol</span>
                <span className="text-xl font-black text-[#00F0FF] font-mono">{isOnDuty ? "1" : "0"}</span>
              </div>
            </div>
            <div className="tactical-panel border-[#FF3B5C]/20 p-4 rounded-[24px]">
              <div className="flex justify-between items-center p-3 bg-[#040B1A] rounded-2xl border border-[#FF3B5C]/20">
                <span className="text-[11px] font-bold text-white/60 font-mono">My Response</span>
                <span className="text-xl font-black text-[#FF3B5C] font-mono">{Array.isArray(myIncidents) ? myIncidents.length : 0}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
