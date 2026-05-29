import { useState } from "react";
import { useRoute } from "wouter";
import { Layout } from "@/components/layout";
import {
  useGetAlert, getGetAlertQueryKey,
  useListAlertMessages, getListAlertMessagesQueryKey,
  useCreateAlertMessage,
  useRespondToAlert,
  useResolveAlert,
  useCancelAlert,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MapPin, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
  responding: "bg-[#00AEEF]/10 text-[#00AEEF] border-[#00AEEF]/30",
  resolved: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30",
  cancelled: "bg-white/5 text-white/30 border-white/10",
};

const ALERT_ICONS: Record<string, string> = {
  MEDICAL: "🏥", FIRE: "🔥", CRIME: "🚔", NATURAL_DISASTER: "🌊",
  VIOLENCE: "⚠️", FLOOD: "💧", DISTURBANCE: "📢", OTHER: "🚨",
};

export default function AlertDetailPage() {
  const [, params] = useRoute("/alerts/:id");
  const id = params?.id ?? "";
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: alert, isLoading } = useGetAlert(id, { query: { queryKey: getGetAlertQueryKey(id), enabled: !!id } });
  const { data: messages = [] } = useListAlertMessages(id, { query: { queryKey: getListAlertMessagesQueryKey(id), refetchInterval: 5000, enabled: !!id } });

  const sendMsg = useCreateAlertMessage();
  const respondMutation = useRespondToAlert();
  const resolveMutation = useResolveAlert();
  const cancelMutation = useCancelAlert();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetAlertQueryKey(id) });
    qc.invalidateQueries({ queryKey: getListAlertMessagesQueryKey(id) });
  };

  function handleSend() {
    if (!message.trim()) return;
    sendMsg.mutate({ id, data: { message } } as any, {
      onSuccess: () => { setMessage(""); invalidate(); },
    });
  }

  function handleRespond() {
    respondMutation.mutate({ id } as any, { onSuccess: () => { toast({ title: "Responding to alert" }); invalidate(); } });
  }

  function handleResolve() {
    resolveMutation.mutate({ id, data: {} } as any, { onSuccess: () => { toast({ title: "Alert resolved" }); invalidate(); } });
  }

  function handleCancel() {
    cancelMutation.mutate({ id } as any, { onSuccess: () => { toast({ title: "Alert cancelled" }); invalidate(); } });
  }

  if (isLoading) return (
    <Layout>
      <div className="p-6">
        <div className="h-48 tactical-panel border-white/5 animate-pulse" />
      </div>
    </Layout>
  );

  if (!alert) return (
    <Layout>
      <div className="p-6 text-center text-white/30 font-mono">Alert not found</div>
    </Layout>
  );

  const a = alert as any;
  const canRespond = (user?.role === "tanod" || user?.role === "admin" || user?.role === "superadmin") && a.status === "pending";
  const canResolve = (user?.role === "tanod" || user?.role === "admin" || user?.role === "superadmin") && ["responding", "pending"].includes(a.status);
  const canCancel = (user?.role === "resident" && user?.id === a.residentId && a.status === "pending") ||
    (["admin", "superadmin"].includes(user?.role ?? "") && a.status !== "resolved");

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6 max-w-2xl">
        <div className="flex items-start gap-4">
          <span className="text-3xl">{ALERT_ICONS[a.type] ?? "🚨"}</span>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-black text-white font-display">{a.type}</h1>
              <Badge className={cn("text-[10px]", STATUS_COLOR[a.status])}>{a.status?.toUpperCase()}</Badge>
            </div>
            <p className="text-[10px] text-white/30 mt-1 font-mono">Reported by {a.residentName} · {new Date(a.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="tactical-panel border-white/5 p-4 space-y-2">
          {a.description && (
            <div>
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Description</span>
              <p className="text-sm text-white mt-1">{a.description}</p>
            </div>
          )}
          <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono">
            <MapPin className="w-3 h-3" />
            {a.location?.lat?.toFixed(4)}, {a.location?.lng?.toFixed(4)}
          </div>
          {a.respondedByName && (
            <p className="text-[10px] text-[#00F0FF] font-mono">Responding Tanod: {a.respondedByName}</p>
          )}
          {a.resolutionNotes && (
            <div>
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Resolution</span>
              <p className="text-sm text-white mt-1">{a.resolutionNotes}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {canRespond && (
            <Button data-testid="button-respond" size="sm" onClick={handleRespond} disabled={respondMutation.isPending}
              className="bg-[#00AEEF] hover:bg-[#00AEEF]/80 text-white text-[10px] font-black uppercase tracking-widest">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Respond to Alert
            </Button>
          )}
          {canResolve && (
            <Button data-testid="button-resolve" size="sm" variant="outline" onClick={handleResolve} disabled={resolveMutation.isPending}
              className="border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/10 text-[10px] font-black uppercase tracking-widest">
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Resolved
            </Button>
          )}
          {canCancel && (
            <Button data-testid="button-cancel" size="sm" variant="outline" onClick={handleCancel} disabled={cancelMutation.isPending}
              className="border-white/10 text-white/30 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest">
              <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel Alert
            </Button>
          )}
        </div>

        <div className="tactical-panel border-white/5 flex flex-col h-96">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <Send className="w-4 h-4 text-[#00F0FF]" />
            <h2 className="text-sm font-semibold text-white">Chat</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {Array.isArray(messages) && messages.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-8 font-mono">No messages yet</p>
            ) : (
              Array.isArray(messages) && messages.map((m: any) => {
                const isMine = m.senderId === user?.id;
                return (
                  <div key={m.id} data-testid={`message-${m.id}`} className={cn("flex flex-col gap-0.5", isMine ? "items-end" : "items-start")}>
                    <span className="text-[10px] text-white/30 font-mono">{m.senderName} · {m.senderRole}</span>
                    <div className={cn("px-3 py-2 rounded-lg text-sm max-w-xs", isMine ? "bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20" : "bg-white/5 text-white border border-white/10")}>
                      {m.message}
                    </div>
                    <span className="text-[10px] text-white/20 font-mono">{new Date(m.timestamp).toLocaleTimeString()}</span>
                  </div>
                );
              })
            )}
          </div>
          {a.status !== "resolved" && a.status !== "cancelled" && (
            <div className="px-4 py-3 border-t border-white/5 flex gap-2">
              <Input data-testid="input-message" value={message} onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Type a message..."
                className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono placeholder:text-white/20" />
              <Button data-testid="button-send-message" size="sm" onClick={handleSend} disabled={sendMsg.isPending || !message.trim()}
                className="bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#040B1A]">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
