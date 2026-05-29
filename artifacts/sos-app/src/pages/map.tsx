import { useEffect } from "react";
import { Layout } from "@/components/layout";
import { useListPatrols, getListPatrolsQueryKey } from "@workspace/api-client-react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const tanodIcon = L.divIcon({
  html: `<div style="width:12px;height:12px;background:#22c55e;border:2px solid #fff;border-radius:50%;box-shadow:0 0 8px #22c55e88;"></div>`,
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const offlineIcon = L.divIcon({
  html: `<div style="width:10px;height:10px;background:#6b7280;border:2px solid #374151;border-radius:50%;"></div>`,
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
        <div className="px-6 py-4 border-b border-border bg-card">
          <h1 className="text-lg font-bold text-foreground">Live Patrol Map</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              {activePatrols.length} tanods on patrol
            </span>
          </p>
        </div>

        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
              <p className="text-sm text-muted-foreground animate-pulse">Loading map...</p>
            </div>
          )}
          <MapContainer
            center={[14.5995, 120.9842]}
            zoom={13}
            style={{ height: "100%", width: "100%", background: "#0a0f1e" }}
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
                    <div style={{ fontFamily: "system-ui", fontSize: 12 }}>
                      <strong>{p.tanodName ?? "Tanod"}</strong><br />
                      Status: {p.status ?? "unknown"}<br />
                      Last ping: {p.lastPing ? new Date(p.lastPing).toLocaleTimeString() : "N/A"}
                    </div>
                  </Popup>
                  {p.isActive && (
                    <Circle
                      center={[p.location.lat, p.location.lng]}
                      radius={200}
                      pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.06, weight: 1, dashArray: "4 4" }}
                    />
                  )}
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        <div className="px-6 py-3 border-t border-border bg-card">
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> On Patrol</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-500 inline-block" /> Offline</span>
            <span className="ml-auto">Auto-refresh every 10s</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
