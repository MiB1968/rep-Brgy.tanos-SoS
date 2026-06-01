import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  AlertTriangle, Zap, Shield, X, Camera, Radio, Map as MapIcon,
  Activity, PhoneCall, Cpu, CheckCircle
} from "lucide-react";
import {
  useCreateAlert,
  useListAlerts,
  useListBroadcasts,
  getListAlertsQueryKey,
  getListBroadcastsQueryKey,
  AlertInput,
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

const STATUS_BAR: Record<string, string> = {
  pending: "33%",
  responding: "66%",
  resolved: "100%",
  cancelled: "100%",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function playSirenSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const duration = 3.0;

    // Create oscillator for siren tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Siren sweep: low to high and back
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.5);
    osc.frequency.linearRampToValueAtTime(600, now + 1.0);
    osc.frequency.linearRampToValueAtTime(1200, now + 1.5);
    osc.frequency.linearRampToValueAtTime(600, now + 2.0);
    osc.frequency.linearRampToValueAtTime(1200, now + 2.5);
    osc.frequency.linearRampToValueAtTime(600, now + 3.0);

    // Gain envelope for pulsing effect
    gain.gain.setValueAtTime(0.15, now);
    for (let i = 0; i < 6; i++) {
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.5 + 0.1);
      gain.gain.linearRampToValueAtTime(0.05, now + i * 0.5 + 0.4);
    }
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.type = "sawtooth";
    osc.start(now);
    osc.stop(now + duration);

    // Auto-close context after sound
    osc.onended = () => ctx.close();
  } catch {
    // AudioContext not available, ignore silently
  }
}

export default function ResidentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const createAlert = useCreateAlert();

  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStart = useRef<number>(0);

  const { data: myAlerts = [] } = useListAlerts(
    { residentId: user?.id },
    { query: { queryKey: getListAlertsQueryKey({ residentId: user?.id }) } }
  );

  const { data: broadcasts = [] } = useListBroadcasts(
    undefined,
    { query: { queryKey: getListBroadcastsQueryKey(undefined) } }
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

  function handleTypedSOS(type: string, description: string) {
    const location = { lat: 14.5995, lng: 120.9842 };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => doCreate({ lat: pos.coords.latitude, lng: pos.coords.longitude }, type, description),
        () => doCreate(location, type, description)
      );
    } else doCreate(location, type, description);
  }

  function doCreate(location: { lat: number; lng: number }, type = "OTHER", description = "SOS triggered by resident") {
    playSirenSound();
    createAlert.mutate(
      { data: { type, location, description } as AlertInput },
      {
        onSuccess: () => {
          toast({ title: "🚨 SOS Alert Sent!", description: "Tanods have been notified. Help is on the way." });
          qc.invalidateQueries({ queryKey: getListAlertsQueryKey({ residentId: user?.id }) });
        },
        onError: () => toast({ title: "Failed to send SOS", variant: "destructive" }),
      }
    );
  }

  const circumference = 2 * Math.PI * 46;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-20 tactical-grid min-h-screen p-4 md:p-8"
    >
      {/* ── HERO HEADER ── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:justify-between items-start md:items-end gap-6 relative tactical-panel p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] tactical-grid overflow-hidden border border-[#00f0ff]/20 shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#040B1A] via-transparent to-[#00AEEF]/5 pointer-events-none" />
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse shadow-[0_0_8px_#00F0FF]" />
            <span className="text-[9px] font-mono text-[#00F0FF] font-black uppercase tracking-[0.4em]">Resident Security Status: Verified</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-5xl font-black italic tracking-tighter uppercase text-white font-display leading-none flex items-center gap-2 sm:gap-4 flex-wrap">
            <Shield className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#00AEEF]" />
            <span>PROTECT</span><span className="text-[#00AEEF]">LOCAL</span>
          </h2>
          <p className="text-[9px] sm:text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] mt-3 bg-white/5 inline-block px-3 py-1 rounded-full border border-white/10">Personal Safety Terminal</p>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT COLUMN — SOS & STATUS */}
        <div className="w-full lg:w-[450px] space-y-6 flex-shrink-0">
          {/* ACTIVE ALERT STATUS */}
          {activeAlert && (
            <motion.div
              variants={itemVariants}
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="tactical-panel border-[#FF3B30]/50 rounded-[40px] p-6 shadow-[0_0_20px_rgba(255,59,48,0.2)] relative overflow-hidden"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#FF3B30] rounded-2xl flex items-center justify-center sos-glow">
                    <Zap className="text-white w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black italic tracking-tighter text-white uppercase font-display">Incident Live</h4>
                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] font-mono">
                      {(activeAlert as any).status?.toUpperCase()} · {(activeAlert as any).type}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 bg-[#040B1A] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#FF3B30] shadow-[0_0_15px_rgba(255,59,48,0.5)]"
                      animate={{ width: STATUS_BAR[(activeAlert as any).status as string] || "33%" }}
                    />
                  </div>
                  <div className="flex justify-between text-[7px] font-mono text-white/20 uppercase tracking-widest">
                    <span>Dispatch</span><span>En Route</span><span>On Scene</span>
                  </div>
                </div>
                {(activeAlert as any).respondedByName && (
                  <p className="text-xs text-[#00F0FF]">Tanod {(activeAlert as any).respondedByName} is responding</p>
                )}
                <Link href={`/alerts/${(activeAlert as any).id}`} className="text-xs text-[#00AEEF] hover:underline mt-1 block">View details</Link>
              </div>
            </motion.div>
          )}

          {/* SOS BUTTON */}
          {!activeAlert && (
            <motion.div
              variants={itemVariants}
              className="relative max-w-2xl mx-auto"
            >
              <div className="tactical-panel p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="relative flex flex-col items-center">
                  {/* Rotating Ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full border-4 border-dashed border-[#00F0FF]/20 shadow-[0_0_30px_rgba(0,240,255,0.1)]"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="absolute w-56 h-56 md:w-72 md:h-72 rounded-full border-2 border-[#00AEEF]/30"
                  />

                  <svg className="w-48 h-48 -rotate-90 relative z-10" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                    <circle
                      cx="50" cy="50" r="46" fill="none"
                      stroke="#FF3B30" strokeWidth="4"
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
                    disabled={createAlert.isPending}
                    className={cn(
                      "absolute z-20 w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all select-none",
                      "text-white font-bold tracking-widest uppercase",
                      holding
                        ? "bg-[#FF3B30]/80 scale-95 shadow-[0_0_40px_rgba(255,59,48,0.6)]"
                        : "bg-[#FF3B30] hover:bg-[#FF3B30]/90 shadow-[0_0_30px_rgba(255,59,48,0.4)] active:scale-95 sos-glow"
                    )}
                  >
                    <span className="text-2xl font-black">SOS</span>
                    <span className="text-[9px] opacity-70">{holding ? "HOLD..." : "HOLD 2s"}</span>
                  </button>
                </div>

                {/* Specialized SOS Buttons */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTypedSOS("MEDICAL", "Medical Emergency reported.")}
                    disabled={createAlert.isPending}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/40">
                      <span className="text-white font-black text-xl">+</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase">Medical</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTypedSOS("FIRE", "Fire Emergency reported.")}
                    disabled={createAlert.isPending}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-orange-600/10 border border-orange-500/30 hover:bg-orange-600/20 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center shadow-lg group-hover:shadow-orange-500/40">
                      <Zap className="text-white w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black text-orange-400 tracking-widest uppercase">Fire</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTypedSOS("CRIME", "Criminal activity reported.")}
                    disabled={createAlert.isPending}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-red-600/10 border border-red-500/30 hover:bg-red-600/20 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:shadow-red-500/40">
                      <Shield className="text-white w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black text-red-400 tracking-widest uppercase">Crime</span>
                  </motion.button>
                </div>

                {/* Footer Bar */}
                <div className="mt-8 flex items-center justify-center gap-4 bg-[#040B1A] border border-[#00F0FF]/20 rounded-full py-4 text-[#00F0FF]/60">
                  <Radio className="w-4 h-4" />
                  <p className="font-black tracking-[0.5em] text-[10px] font-mono uppercase">Tactical Emergency Signal</p>
                  <Radio className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Photo Evidence */}
          <motion.div variants={itemVariants} className="p-6 tactical-panel border-white/5 rounded-[32px] space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 font-mono">Incident Evidence</label>
              <button onClick={() => photoInputRef.current?.click()} className="p-2 bg-white/5 rounded-xl text-white/60 hover:bg-white/10">
                <Camera className="w-4 h-4" />
              </button>
              <input type="file" ref={photoInputRef} className="hidden" accept="image/*" multiple onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setSelectedPhotos((prev) => [...prev, ...files].slice(0, 4));
              }} />
            </div>
            {selectedPhotos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {selectedPhotos.map((file, idx) => (
                  <div key={idx} className="relative min-w-[80px] h-20 rounded-xl overflow-hidden border border-white/10">
                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                    <button onClick={() => setSelectedPhotos(p => p.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white">
                      <X className="w-2 h-2" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* RIGHT COLUMN — INTEL & TRACKER */}
        <div className="flex-1 w-full space-y-6">
          {/* Quick Links Grid */}
          <motion.div variants={itemVariants} className="tactical-panel border-white/5 p-6 rounded-[32px] bg-black/20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "map", label: "Livemap", icon: MapIcon, color: "text-[#00F0FF]" },
                { id: "tracker", label: "Tracker", icon: Activity, color: "text-[#10B981]" },
                { id: "directory", label: "Hotlines", icon: PhoneCall, color: "text-[#F43F5E]" },
                { id: "guardian", label: "Guardian", icon: Cpu, color: "text-[#A855F7]" }
              ].map(mod => (
                <Link key={mod.id} href={`/${mod.id}`}>
                  <button className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 group transition-all w-full">
                    <mod.icon className={`w-4 h-4 ${mod.color}`} />
                    <span className="text-[10px] font-black uppercase font-mono text-white/60 group-hover:text-white">{mod.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Broadcasts */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00F0FF] font-mono italic">Active Broadcasts</h3>
            {Array.isArray(broadcasts) && broadcasts.length === 0 ? (
              <div className="tactical-panel border border-white/5 rounded-[32px] p-4 text-center text-sm text-white/40">
                <Radio className="w-6 h-6 mx-auto mb-2 text-white/20" />
                No active broadcasts
              </div>
            ) : (
              <div className="space-y-2">
                {Array.isArray(broadcasts) && broadcasts.slice(0, 3).map((b: any) => (
                  <div key={b.id} className="tactical-panel border border-[#00AEEF]/20 rounded-[24px] p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Radio className="w-3 h-3 text-[#00AEEF]" />
                      <span className="text-[10px] font-medium text-[#00AEEF] uppercase tracking-wider">{b.type ?? "broadcast"}</span>
                      <span className="text-[10px] text-white/30 ml-auto">{new Date(b.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-white/80">{b.message}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Alerts */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00F0FF] font-mono italic">My Recent Alerts</h3>
            {Array.isArray(myAlerts) && myAlerts.length === 0 ? (
              <div className="tactical-panel border border-white/5 rounded-[32px] p-6 text-center text-sm text-white/40">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-white/20" />
                No alerts yet
              </div>
            ) : (
              <div className="space-y-2">
                {Array.isArray(myAlerts) && myAlerts.slice(0, 5).map((a: any) => (
                  <Link key={a.id} href={`/alerts/${a.id}`} data-testid={`card-alert-${a.id}`}>
                    <div className="tactical-panel border border-white/5 rounded-[24px] px-4 py-3 hover:border-[#00AEEF]/40 transition-all flex items-center gap-3 cursor-pointer">
                      <span className="text-lg">{ALERT_TYPE_ICONS[a.type] ?? "🚨"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{a.type}</div>
                        <div className="text-[10px] text-white/30">{new Date(a.createdAt).toLocaleString()}</div>
                      </div>
                      <Badge className={cn("text-[10px]", STATUS_COLOR[a.status])}>{a.status?.toUpperCase()}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
