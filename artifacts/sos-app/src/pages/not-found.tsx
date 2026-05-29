import { Shield, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#040B1A] relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,240,255,0.08)_0%,_transparent_60%)] pointer-events-none" />

      <div className="tactical-panel border-[#FF3B5C]/20 p-8 rounded-[40px] text-center max-w-md mx-4 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <AlertTriangle className="w-8 h-8 text-[#FF3B5C]" />
          <h1 className="text-2xl font-black text-white font-display uppercase tracking-wider">404 Lost</h1>
        </div>
        <p className="text-sm text-white/30 font-mono">
          The sector you requested is not on the tactical grid.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#FF3B5C]/40 font-mono uppercase tracking-widest">
          <Shield className="w-3 h-3" />
          <span>Brgy Tanod S.O.S</span>
          <Shield className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
