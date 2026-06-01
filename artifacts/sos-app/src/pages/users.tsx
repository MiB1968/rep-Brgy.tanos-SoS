import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListUsers, getListUsersQueryKey,
  useApproveUser,
  useRejectUser,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
  approved: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30",
  rejected: "bg-[#FF3B5C]/10 text-[#FF3B5C] border-[#FF3B5C]/30",
  active: "bg-[#00AEEF]/10 text-[#00AEEF] border-[#00AEEF]/30",
};

const ROLE_COLOR: Record<string, string> = {
  resident: "bg-[#00AEEF]/10 text-[#00AEEF]",
  tanod: "bg-[#10B981]/10 text-[#10B981]",
  admin: "bg-[#F59E0B]/10 text-[#F59E0B]",
  superadmin: "bg-[#FF3B5C]/10 text-[#FF3B5C]",
};

export default function UsersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const params: Record<string, string> = {};
  if (roleFilter) params.role = roleFilter;
  if (statusFilter) params.status = statusFilter;

  const { data: users = [], isLoading } = useListUsers(
    params,
    { query: { queryKey: getListUsersQueryKey(params) } }
  );

  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();

  function handleApprove(id: string) {
    approveUser.mutate({ id } as any, {
      onSuccess: () => { toast({ title: "User approved" }); qc.invalidateQueries({ queryKey: getListUsersQueryKey(params) }); },
    });
  }

  function handleReject(id: string) {
    rejectUser.mutate({ id } as any, {
      onSuccess: () => { toast({ title: "User rejected" }); qc.invalidateQueries({ queryKey: getListUsersQueryKey(params) }); },
    });
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6 tactical-grid min-h-screen">
        <div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase text-white font-display flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#00AEEF]" />
            User Management
          </h1>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mt-1">{Array.isArray(users) ? users.length : 0} users</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1">
            {["", "resident", "tanod", "admin"].map(r => (
              <button
                key={r || "all"}
                data-testid={`filter-role-${r || "all"}`}
                onClick={() => setRoleFilter(r)}
                className={cn(
                  "px-3 py-1.5 text-[10px] rounded-lg border transition-all font-black uppercase tracking-wider font-mono",
                  roleFilter === r ? "bg-[#00F0FF]/10 border-[#00F0FF]/50 text-[#00F0FF]" : "bg-[#040B1A] border-white/10 text-white/30 hover:text-white/60"
                )}
              >
                {r ? r.charAt(0).toUpperCase() + r.slice(1) : "All"}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {["", "pending", "approved", "rejected"].map(s => (
              <button
                key={s || "all"}
                data-testid={`filter-status-${s || "all"}`}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 text-[10px] rounded-lg border transition-all font-black uppercase tracking-wider font-mono",
                  statusFilter === s ? "bg-[#00F0FF]/10 border-[#00F0FF]/50 text-[#00F0FF]" : "bg-[#040B1A] border-white/10 text-white/30 hover:text-white/60"
                )}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 tactical-panel border-white/5 animate-pulse" />)}</div>
        ) : Array.isArray(users) && users.length === 0 ? (
          <div className="tactical-panel border-white/5 p-12 text-center">
            <Users className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/30 font-mono">No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.isArray(users) && users.map((u: any) => (
              <div key={u.id} data-testid={`card-user-${u.id}`} className="tactical-panel border-white/5 rounded-[24px] px-4 py-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center text-xs font-bold text-[#00F0FF] flex-shrink-0 uppercase">
                  {u.name?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{u.name}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium font-mono", ROLE_COLOR[u.role])}>{u.role}</span>
                    <Badge className={cn("text-[10px]", STATUS_COLOR[u.status])}>{u.status?.toUpperCase()}</Badge>
                  </div>
                  <p className="text-xs text-white/30 font-mono">{u.email}</p>
                  {u.phone && <p className="text-xs text-white/30 font-mono">{u.phone}</p>}
                </div>
                {u.status === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      data-testid={`button-approve-${u.id}`}
                      size="sm"
                      onClick={() => handleApprove(u.id)}
                      disabled={approveUser.isPending}
                      className="bg-[#10B981] hover:bg-[#10B981]/80 text-white text-[10px] h-7 px-2 font-black"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                    <Button
                      data-testid={`button-reject-${u.id}`}
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(u.id)}
                      disabled={rejectUser.isPending}
                      className="border-[#FF3B5C]/30 text-[#FF3B5C] hover:bg-[#FF3B5C]/10 text-[10px] h-7 px-2 font-black"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
