import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  useGetDashboardStats, getGetDashboardStatsQueryKey,
  useGetAlertsByType, getGetAlertsByTypeQueryKey,
  useGetRecentActivity, getGetRecentActivityQueryKey,
  useGetTanodPerformance, getGetTanodPerformanceQueryKey,
} from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  AlertTriangle, Users, Shield, CheckCircle, Clock, UserCheck,
  Map as MapIcon, Activity, Calendar, Radio, FileText, PhoneCall,
  Cpu, Settings, Grid, Terminal, History, Eye, AlertOctagon,
  ShieldAlert, Zap
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#FF3B5C", "#00AEEF", "#F59E0B", "#00F0FF", "#84cc16", "#A855F7", "#ec4899", "#14B8A6"];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function StatCard({ label, value, icon: Icon, color, border, onClick, pulse }: any) {
  return (
    <motion.div
      variants={itemVariants}
      onClick={onClick}
      className={cn(
        "tactical-panel p-4 border cursor-pointer transition-all hover:scale-[1.02] relative overflow-hidden",
        border
      )}
    >
      <div className={cn("p-3 rounded-2xl inline-flex mb-4 transition-all shadow-2xl relative z-10", `bg-${color}/10`, color.startsWith("#") ? "" : color, pulse && "animate-pulse")}>
        <Icon className={cn("w-5 h-5", color.startsWith("#") ? `text-[${color}]` : color)} />
      </div>
      <div className="relative z-10">
        <h4 className="text-[9px] font-black uppercase text-white/40 tracking-[0.4em] mb-2 font-mono">{label}</h4>
        <p className="text-3xl font-black text-white italic tracking-tighter font-display leading-none">{value}</p>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: alertsByType = [] } = useGetAlertsByType({ query: { queryKey: getGetAlertsByTypeQueryKey() } });
  const { data: recentActivity = [] } = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey() } });
  const { data: tanodPerf = [] } = useGetTanodPerformance({ query: { queryKey: getGetTanodPerformanceQueryKey() } });

  const s = stats as any;
  const activeAlerts = s?.activeAlerts ?? 0;
  const isFlashing = activeAlerts > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 md:space-y-8 pb-20 tactical-grid min-h-screen p-4 md:p-8"
    >
      {/* Emergency Banner */}
      {isFlashing && (
        <motion.div
          variants={itemVariants}
          className="animate-flash-red tactical-panel border-[#FF3B5C]/40 rounded-[40px] p-6 border-l-4 border-l-[#FF3B5C] shadow-[0_0_20px_rgba(255,59,48,0.2)]"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#FF3B5C] text-white animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase text-[#FF3B5C] tracking-widest font-mono">ACTIVE EMERGENCY ALERT</h4>
              <p className="text-lg font-black italic tracking-tighter uppercase text-white font-display mt-1">{activeAlerts} SOS ALERT{activeAlerts > 1 ? "S" : ""} PENDING</p>
            </div>
          </div>
        </motion.div>
      )}

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
              <span className="text-[9px] font-mono text-[#00F0FF] font-black uppercase tracking-[0.4em]">Central Command Online</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-black italic tracking-tighter uppercase text-white font-display leading-none flex items-center gap-3">
              <Zap className="w-7 h-7 sm:w-10 sm:h-10 text-[#00AEEF]" />
              <span>COMMAND</span><span className="text-[#00AEEF]">DASH</span>
            </h2>
            <p className="text-[9px] sm:text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] mt-3 bg-white/5 inline-block px-3 py-1 rounded-full border border-white/10">Administrative Control Terminal</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30">
              {user?.role}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <StatCard label="Total Alerts" value={s?.totalAlerts ?? 0} icon={AlertTriangle} color="#FF3B5C" border="border-[#FF3B5C]/20" pulse={activeAlerts > 0} />
        <StatCard label="Active Alerts" value={activeAlerts} icon={Clock} color="#F59E0B" border="border-[#F59E0B]/20" pulse={activeAlerts > 0} />
        <StatCard label="Resolved Today" value={s?.resolvedToday ?? 0} icon={CheckCircle} color="#10B981" border="border-[#10B981]/20" />
        <StatCard label="Active Tanods" value={s?.activeTanods ?? 0} icon={Shield} color="#00AEEF" border="border-[#00AEEF]/20" />
        <StatCard label="Pending Users" value={s?.pendingUsers ?? 0} icon={UserCheck} color="#F59E0B" border="border-[#F59E0B]/20" pulse={s?.pendingUsers > 0} />
        <StatCard label="Total Residents" value={s?.totalResidents ?? 0} icon={Users} color="#00F0FF" border="border-[#00F0FF]/20" />
      </div>

      {/* Charts + Activity */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* LEFT: Chart */}
        <div className="flex-1 w-full">
          <motion.div variants={itemVariants} className="tactical-panel border-[#00F0FF]/10 p-5 md:p-6 rounded-[32px]">
            <div className="flex items-center gap-2 mb-4">
              <BarChart className="w-4 h-4 text-[#00F0FF]" />
              <h3 className="text-xs font-black uppercase tracking-widest text-[#00F0FF] font-mono">Alerts by Type</h3>
            </div>
            {Array.isArray(alertsByType) && alertsByType.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-sm text-white/30">
                <Activity className="w-6 h-6 mr-2 text-white/20" />
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={Array.isArray(alertsByType) ? alertsByType : []} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="type" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Rajdhani" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Rajdhani" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "rgba(4,11,26,0.95)", border: "1px solid rgba(0,240,255,0.2)", borderRadius: 12, fontSize: 12, fontFamily: "Rajdhani" }}
                    labelStyle={{ color: "#00F0FF" }}
                    itemStyle={{ color: "rgba(255,255,255,0.7)" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {Array.isArray(alertsByType) && alertsByType.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* RIGHT: Activity Feed */}
        <div className="w-full xl:w-[380px] flex-shrink-0">
          <motion.div variants={itemVariants} className="tactical-panel border-white/5 p-5 rounded-[32px]">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-[#00F0FF]" />
              <h3 className="text-xs font-black uppercase tracking-widest text-[#00F0FF] font-mono">Recent Activity</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Array.isArray(recentActivity) && recentActivity.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-4">No activity yet</p>
              ) : (
                Array.isArray(recentActivity) && recentActivity.slice(0, 10).map((item: any) => (
                  <div key={item.id} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0", item.category === "alert" ? "bg-[#FF3B5C]" : "bg-[#00AEEF]")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 line-clamp-2">{item.description}</p>
                      <p className="text-[10px] text-white/20 mt-0.5">{new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tactical Operations Hub */}
      <motion.div variants={itemVariants} className="tactical-panel border-[#00F0FF]/20 p-5 md:p-6 rounded-[32px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00F0FF]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
          <div>
            <span className="text-[9px] font-black tracking-widest text-[#00F0FF] font-mono uppercase">SECURE_ROUTING_GRID</span>
            <h2 className="text-xl md:text-2xl font-black italic tracking-tight font-display text-white mt-1 flex items-center gap-2">
              <Grid className="w-5 h-5 text-[#00F0FF] animate-pulse" />
              TACTICAL OPERATIONS HUB
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold text-white/30 tracking-wider uppercase bg-white/5 px-3 py-1 rounded-full border border-white/5 animate-pulse">
            CONNECTED: {activeAlerts + (s?.activeTanods ?? 0)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 relative z-10">
          {[
            { id: "map", label: "Live Intel Map", icon: MapIcon, desc: "Active Heatmaps", color: "text-[#00F0FF] border-[#00F0FF]/10 hover:bg-[#00F0FF]/5 hover:border-[#00F0FF]/45" },
            { id: "alerts", label: "Alert Feed", icon: Activity, desc: "Active SOS", color: "text-[#10B981] border-[#10B981]/10 hover:bg-[#10B981]/5 hover:border-[#10B981]/45" },
            { id: "users", label: "Verifications", icon: UserCheck, desc: "Access Clearances", color: "text-[#F59E0B] border-[#F59E0B]/10 hover:bg-[#F59E0B]/5 hover:border-[#F59E0B]/45" },
            { id: "incidents", label: "Threat Feed", icon: AlertOctagon, desc: "Incident Reports", color: "text-[#FF3B5C] border-[#FF3B5C]/10 hover:bg-[#FF3B5C]/5 hover:border-[#FF3B5C]/45" },
            { id: "shifts", label: "Shift Planner", icon: Calendar, desc: "Patrol Schedules", color: "text-[#6366F1] border-[#6366F1]/10 hover:bg-[#6366F1]/5 hover:border-[#6366F1]/45" },
            { id: "broadcasts", label: "Broadcasts", icon: Radio, desc: "System Alerts", color: "text-[#F43F5E] border-[#F43F5E]/10 hover:bg-[#F43F5E]/5 hover:border-[#F43F5E]/45" },
            { id: "activity", label: "Telemetry", icon: Terminal, desc: "Activity Logs", color: "text-[#14B8A6] border-[#14B8A6]/10 hover:bg-[#14B8A6]/5 hover:border-[#14B8A6]/45" },
            { id: "settings", label: "Config Admin", icon: Settings, desc: "Engine Settings", color: "text-[#94A3B8] border-[#94A3B8]/10 hover:bg-[#94A3B8]/5 hover:border-[#94A3B8]/45" }
          ].map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.id} href={`/${mod.id}`}>
                <button className={`flex flex-col text-left p-3.5 rounded-2xl border bg-black/40 transition-all active:scale-95 duration-300 hover:scale-[1.03] hover:shadow-lg select-none group cursor-pointer w-full ${mod.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 ml-0 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
                      <Icon className="w-5 h-5 text-white/70 group-hover:text-white" />
                    </div>
                    <span className="text-[7px] font-mono text-white/20 font-black tracking-widest uppercase group-hover:text-white/40 transition-colors">SYNC</span>
                  </div>
                  <h4 className="text-[10px] font-black uppercase font-mono tracking-wider italic text-white/90 leading-tight group-hover:text-white transition-colors">{mod.label}</h4>
                  <p className="text-[8px] font-bold text-white/30 tracking-tight leading-normal mt-1 font-mono truncate">{mod.desc}</p>
                </button>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Tanod Performance */}
      <motion.div variants={itemVariants} className="tactical-panel border-white/5 p-5 rounded-[32px]">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-[#00F0FF]" />
          <h3 className="text-xs font-black uppercase tracking-widest text-[#00F0FF] font-mono">Tanod Performance</h3>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {Array.isArray(tanodPerf) && tanodPerf.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-4">No tanod data yet</p>
          ) : (
            Array.isArray(tanodPerf) && tanodPerf.map((t: any) => (
              <div key={t.tanodId} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="w-8 h-8 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center text-xs font-bold text-[#00F0FF]">
                  {t.tanodName?.[0] ?? "T"}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{t.tanodName}</div>
                  <div className="text-[10px] text-white/30">{t.alertsResponded} alerts · avg {t.avgResponseTimeMinutes}min</div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
