import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListBroadcasts, getListBroadcastsQueryKey,
  useCreateBroadcast,
  useUpdateBroadcast,
  BroadcastInput,
  BroadcastUpdate,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Radio, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  message: z.string().min(5, "Message must be at least 5 characters"),
  type: z.string().min(1, "Type is required"),
});

type FormData = z.infer<typeof schema>;

const TYPE_COLOR: Record<string, string> = {
  evacuation: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30",
  calamity: "text-[#00AEEF] bg-[#00AEEF]/10 border-[#00AEEF]/30",
  security: "text-[#FF3B5C] bg-[#FF3B5C]/10 border-[#FF3B5C]/30",
  emergency: "text-[#00F0FF] bg-[#00F0FF]/10 border-[#00F0FF]/30",
  other: "text-white/30 bg-white/5 border-white/10",
};

export default function BroadcastsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: broadcasts = [], isLoading } = useListBroadcasts(
    undefined,
    { query: { queryKey: getListBroadcastsQueryKey(undefined) } }
  );

  const createBroadcast = useCreateBroadcast();
  const updateBroadcast = useUpdateBroadcast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { message: "", type: "other" },
  });

  function onSubmit(data: FormData) {
    createBroadcast.mutate({ data: data as BroadcastInput }, {
      onSuccess: () => {
        toast({ title: "Broadcast sent" });
        setOpen(false);
        form.reset();
        qc.invalidateQueries({ queryKey: getListBroadcastsQueryKey({}) });
      },
      onError: () => toast({ title: "Failed to send broadcast", variant: "destructive" }),
    });
  }

  function toggleActive(id: string, isActive: boolean) {
    updateBroadcast.mutate({ id, data: { isActive: !isActive } as BroadcastUpdate }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListBroadcastsQueryKey({}) }),
    });
  }

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6 tactical-grid min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase text-white font-display flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#FF3B5C]" />
              Broadcasts
            </h1>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mt-1">System-wide announcements</p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-broadcast" size="sm" className="bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#040B1A] font-black text-[10px] uppercase tracking-widest">
                  <Plus className="w-4 h-4 mr-1" /> New Broadcast
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#040B1A] border-[#00F0FF]/20">
                <DialogHeader><DialogTitle className="text-white font-display">Create Broadcast</DialogTitle></DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] text-[#00F0FF] font-mono uppercase tracking-wider">Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-broadcast-type" className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#040B1A] border-[#00F0FF]/20">
                            <SelectItem value="evacuation" className="text-white font-mono">Evacuation</SelectItem>
                            <SelectItem value="calamity" className="text-white font-mono">Calamity</SelectItem>
                            <SelectItem value="security" className="text-white font-mono">Security</SelectItem>
                            <SelectItem value="emergency" className="text-white font-mono">Emergency</SelectItem>
                            <SelectItem value="other" className="text-white font-mono">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="message" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] text-[#00F0FF] font-mono uppercase tracking-wider">Message</FormLabel>
                        <FormControl><Input data-testid="input-broadcast-message" placeholder="Broadcast message..." className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={createBroadcast.isPending} className="w-full bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#040B1A] font-black">
                      Send Broadcast
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 tactical-panel border-white/5 animate-pulse" />)}</div>
        ) : Array.isArray(broadcasts) && broadcasts.length === 0 ? (
          <div className="tactical-panel border-white/5 p-12 text-center">
            <Radio className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/30 font-mono">No broadcasts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Array.isArray(broadcasts) && broadcasts.map((b: any) => (
              <div key={b.id} data-testid={`card-broadcast-${b.id}`} className={cn("tactical-panel rounded-[24px] px-4 py-4", b.isActive ? "border-[#00F0FF]/20" : "border-white/5 opacity-60")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Radio className={cn("w-3.5 h-3.5", b.isActive ? "text-[#00F0FF]" : "text-white/30")} />
                      {b.type && (
                        <span className={cn("text-[10px] px-2 py-0.5 rounded border font-medium uppercase tracking-wide font-mono", TYPE_COLOR[b.type] ?? "text-white/30 bg-white/5 border-white/10")}>
                          {b.type}
                        </span>
                      )}
                      {b.isActive && <span className="text-[10px] text-[#00F0FF] font-medium uppercase font-mono">ACTIVE</span>}
                    </div>
                    <p className="text-sm text-white">{b.message}</p>
                    <p className="text-[10px] text-white/20 mt-1 font-mono">{b.adminName} · {new Date(b.timestamp).toLocaleString()}</p>
                  </div>
                  {isAdmin && (
                    <Button
                      data-testid={`button-toggle-broadcast-${b.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(b.id, b.isActive)}
                      className="text-[10px] border-[#00F0FF]/20 text-white/30 hover:text-white font-mono flex-shrink-0"
                    >
                      {b.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
