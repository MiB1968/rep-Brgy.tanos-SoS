import { useEffect } from "react";
import { Layout } from "@/components/layout";
import { useListPatrols, getListPatrolsQueryKey } from "@workspace/api-client-react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { MapPin, Radio } from "lucide-react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const tanodIcon = L.divIcon({
  html: `<div style="width:12px;height:12px;background:#00F0FF;border:2px solid #fff;border-radius:50%;box-shadow:0 0 12px #00F0FF88;"></div>`,
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const offlineIcon = L.divIcon({
  html: `<div style="width:10px;height:10px;background:#374151;border:2px solid #1a1a2e;border-radius:50%;"></div>`,
  className: "",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

export default function MapPage() {
  const { data: patrols = [], isLoading } = useListPatrols({
    query: { queryKey: getListPatrolsQueryKey(), refetchInterval: 10000 }
  });

  const activePatrols = Array.isArray(patrols) ? patrols.filter((p: any) => p.isActive && p.location) : [];
  const allPatrols = Array.isArray(patrols) ? patrols : [];

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-[#00F0FF]/10 bg-[#040B1A]/90 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#00F0FF]" />
            <h1 className="text-lg font-black text-white font-display uppercase tracking-wider">Live Patrol Map</h1>
          </div>
          <p className="text-[10px] font-mono text-[#00F0FF]/60 uppercase tracking-[0.2em] mt-0.5">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse inline-block shadow-[0_0_8px_#00F0FF]" />
              {activePatrols.length} tanods on patrol
            </span>
          </p>
        </div>

        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-[#040B1A]/60 flex items-center justify-center z-10">
              <p className="text-sm text-[#00F0FF] animate-pulse font-mono">Loading tactical grid...</p>
            </div>
          )}
          <MapContainer
            center={[14.5995, 120.9842]}
            zoom={13}
            style={{ height: "100%", width: "100%", background: "#040B1A" }}
            className="h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {allPatrols.map((p: any) => {
              if (!p.location?.lat || !p.location?.lng) return null;
              return (
                <Marker
                  key={p.tanodId}
                  position={[p.location.lat, p.location.lng]}
                  icon={p.isActive ? tanodIcon : offlineIcon}
                >
                  <Popup>
                    <div style={{ fontFamily: "Rajdhani, monospace", fontSize: 12, background: "#040B1A", color: "#00F0FF", border: "1px solid rgba(0,240,255,0.3)", padding: 8, borderRadius: 8 }}>
                      <strong>{p.tanodName ?? "Tanod"}</strong><br />
                      Status: <span style={{ color: p.isActive ? "#00F0FF" : "#94A3B8" }}>{p.status ?? "unknown"}</span><br />
                      Last ping: {p.lastPing ? new Date(p.lastPing).toLocaleTimeString() : "N/A"}
                    </div>
                  </Popup>
                  {p.isActive && (
                    <Circle
                      center={[p.location.lat, p.location.lng]}
                      radius={200}
                      pathOptions={{ color: "#00F0FF", fillColor: "#00F0FF", fillOpacity: 0.08, weight: 1, dashArray: "4 4" }}
                    />
                  )}
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        <div className="px-6 py-3 border-t border-[#00F0FF]/10 bg-[#040B1A]/90">
          <div className="flex items-center gap-6 text-[10px] font-mono text-white/30 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#00F0FF] inline-block shadow-[0_0_6px_#00F0FF]" /> On Patrol</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#374151] inline-block" /> Offline</span>
            <span className="ml-auto flex items-center gap-1"><Radio className="w-3 h-3" /> Auto-refresh every 10s</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
