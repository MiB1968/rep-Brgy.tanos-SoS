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
import { Users, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-900/40 text-amber-300 border-amber-700",
  approved: "bg-green-900/40 text-green-300 border-green-700",
  rejected: "bg-red-900/40 text-red-300 border-red-700",
  active: "bg-blue-900/40 text-blue-300 border-blue-700",
};

const ROLE_COLOR: Record<string, string> = {
  resident: "bg-blue-900/30 text-blue-300",
  tanod: "bg-green-900/30 text-green-300",
  admin: "bg-amber-900/30 text-amber-300",
  superadmin: "bg-primary/20 text-primary",
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
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">User Management</h1>
          <p className="text-xs text-muted-foreground">{Array.isArray(users) ? users.length : 0} users</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1">
            {["", "resident", "tanod", "admin"].map(r => (
              <button
                key={r || "all"}
                data-testid={`filter-role-${r || "all"}`}
                onClick={() => setRoleFilter(r)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md border transition-colors",
                  roleFilter === r ? "bg-primary/20 border-primary/50 text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {r ? r.charAt(0).toUpperCase() + r.slice(1) : "All Roles"}
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
                  "px-3 py-1.5 text-xs rounded-md border transition-colors",
                  statusFilter === s ? "bg-primary/20 border-primary/50 text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All Status"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-card border border-border rounded-lg animate-pulse" />)}</div>
        ) : Array.isArray(users) && users.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.isArray(users) && users.map((u: any) => (
              <div key={u.id} data-testid={`card-user-${u.id}`} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0 uppercase">
                  {u.name?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{u.name}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", ROLE_COLOR[u.role])}>{u.role}</span>
                    <Badge className={cn("text-[10px]", STATUS_COLOR[u.status])}>{u.status?.toUpperCase()}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
                </div>
                {u.status === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      data-testid={`button-approve-${u.id}`}
                      size="sm"
                      onClick={() => handleApprove(u.id)}
                      disabled={approveUser.isPending}
                      className="bg-green-700 hover:bg-green-600 text-white text-xs h-7 px-2"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                    <Button
                      data-testid={`button-reject-${u.id}`}
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(u.id)}
                      disabled={rejectUser.isPending}
                      className="border-red-700 text-red-400 hover:bg-red-900/20 text-xs h-7 px-2"
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
