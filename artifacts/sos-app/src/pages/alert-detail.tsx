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
import { Send, MapPin } from "lucide-react";
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
        <div className="h-48 bg-card border border-border rounded-lg animate-pulse" />
      </div>
    </Layout>
  );

  if (!alert) return (
    <Layout>
      <div className="p-6 text-center text-muted-foreground">Alert not found</div>
    </Layout>
  );

  const a = alert as any;
  const canRespond = (user?.role === "tanod" || user?.role === "admin" || user?.role === "superadmin") && a.status === "pending";
  const canResolve = (user?.role === "tanod" || user?.role === "admin" || user?.role === "superadmin") && ["responding", "pending"].includes(a.status);
  const canCancel = (user?.role === "resident" && user?.id === a.residentId && a.status === "pending") ||
    (["admin", "superadmin"].includes(user?.role ?? "") && a.status !== "resolved");

  return (
    <Layout>
      <div className="p-6 space-y-5 max-w-2xl">
        <div className="flex items-start gap-4">
          <span className="text-3xl">{ALERT_ICONS[a.type] ?? "🚨"}</span>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{a.type}</h1>
              <Badge className={cn("text-[10px]", STATUS_COLOR[a.status])}>{a.status?.toUpperCase()}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Reported by {a.residentName} · {new Date(a.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {a.description && (
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Description</span>
              <p className="text-sm text-foreground mt-1">{a.description}</p>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {a.location?.lat?.toFixed(4)}, {a.location?.lng?.toFixed(4)}
          </div>
          {a.respondedByName && (
            <p className="text-xs text-blue-400">Responding Tanod: {a.respondedByName}</p>
          )}
          {a.resolutionNotes && (
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Resolution</span>
              <p className="text-sm text-foreground mt-1">{a.resolutionNotes}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {canRespond && (
            <Button
              data-testid="button-respond"
              size="sm"
              onClick={handleRespond}
              disabled={respondMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              Respond to Alert
            </Button>
          )}
          {canResolve && (
            <Button
              data-testid="button-resolve"
              size="sm"
              variant="outline"
              onClick={handleResolve}
              disabled={resolveMutation.isPending}
              className="border-green-700 text-green-400 hover:bg-green-900/30 text-xs"
            >
              Mark Resolved
            </Button>
          )}
          {canCancel && (
            <Button
              data-testid="button-cancel"
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="border-gray-600 text-gray-400 hover:bg-gray-800 text-xs"
            >
              Cancel Alert
            </Button>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg flex flex-col h-96">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Chat</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {Array.isArray(messages) && messages.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No messages yet</p>
            ) : (
              Array.isArray(messages) && messages.map((m: any) => {
                const isMine = m.senderId === user?.id;
                return (
                  <div key={m.id} data-testid={`message-${m.id}`} className={cn("flex flex-col gap-0.5", isMine ? "items-end" : "items-start")}>
                    <span className="text-[10px] text-muted-foreground">{m.senderName} · {m.senderRole}</span>
                    <div className={cn("px-3 py-2 rounded-lg text-sm max-w-xs", isMine ? "bg-primary/20 text-primary-foreground" : "bg-muted text-foreground")}>
                      {m.message}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{new Date(m.timestamp).toLocaleTimeString()}</span>
                  </div>
                );
              })
            )}
          </div>
          {a.status !== "resolved" && a.status !== "cancelled" && (
            <div className="px-4 py-3 border-t border-border flex gap-2">
              <Input
                data-testid="input-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="bg-background border-border text-sm"
              />
              <Button
                data-testid="button-send-message"
                size="sm"
                onClick={handleSend}
                disabled={sendMsg.isPending || !message.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
