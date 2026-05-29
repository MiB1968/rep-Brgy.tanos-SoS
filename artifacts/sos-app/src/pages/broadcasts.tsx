import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListBroadcasts,
  useCreateBroadcast,
  useUpdateBroadcast,
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
  evacuation: "text-amber-300 bg-amber-900/30 border-amber-700",
  calamity: "text-blue-300 bg-blue-900/30 border-blue-700",
  security: "text-red-300 bg-red-900/30 border-red-700",
  emergency: "text-primary bg-primary/20 border-primary/50",
  other: "text-muted-foreground bg-muted border-border",
};

export default function BroadcastsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: broadcasts = [], isLoading } = useListBroadcasts(
    {},
    { query: { queryKey: ["broadcasts"] } }
  );

  const createBroadcast = useCreateBroadcast();
  const updateBroadcast = useUpdateBroadcast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { message: "", type: "other" },
  });

  function onSubmit(data: FormData) {
    createBroadcast.mutate({ data } as any, {
      onSuccess: () => {
        toast({ title: "Broadcast sent" });
        setOpen(false);
        form.reset();
        qc.invalidateQueries({ queryKey: ["broadcasts"] });
      },
      onError: () => toast({ title: "Failed to send broadcast", variant: "destructive" }),
    });
  }

  function toggleActive(id: string, isActive: boolean) {
    updateBroadcast.mutate({ id, data: { isActive: !isActive } } as any, {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["broadcasts"] }),
    });
  }

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  return (
    <Layout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Broadcasts</h1>
            <p className="text-xs text-muted-foreground">System-wide announcements and alerts</p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-broadcast" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
                  <Plus className="w-4 h-4 mr-1" /> New Broadcast
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Create Broadcast</DialogTitle></DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase">Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-broadcast-type" className="bg-background border-border">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="evacuation">Evacuation</SelectItem>
                            <SelectItem value="calamity">Calamity</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="message" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase">Message</FormLabel>
                        <FormControl><Input data-testid="input-broadcast-message" placeholder="Broadcast message..." className="bg-background border-border" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={createBroadcast.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      Send Broadcast
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-card border border-border rounded-lg animate-pulse" />)}</div>
        ) : Array.isArray(broadcasts) && broadcasts.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No broadcasts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Array.isArray(broadcasts) && broadcasts.map((b: any) => (
              <div key={b.id} data-testid={`card-broadcast-${b.id}`} className={cn("bg-card border rounded-lg px-4 py-4", b.isActive ? "border-primary/30" : "border-border opacity-60")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Radio className={cn("w-3.5 h-3.5", b.isActive ? "text-primary" : "text-muted-foreground")} />
                      {b.type && (
                        <span className={cn("text-[10px] px-2 py-0.5 rounded border font-medium uppercase tracking-wide", TYPE_COLOR[b.type] ?? "text-muted-foreground bg-muted border-border")}>
                          {b.type}
                        </span>
                      )}
                      {b.isActive && <span className="text-[10px] text-primary font-medium uppercase">ACTIVE</span>}
                    </div>
                    <p className="text-sm text-foreground">{b.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{b.adminName} · {new Date(b.timestamp).toLocaleString()}</p>
                  </div>
                  {isAdmin && (
                    <Button
                      data-testid={`button-toggle-broadcast-${b.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(b.id, b.isActive)}
                      className="text-xs border-border text-muted-foreground hover:text-foreground flex-shrink-0"
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
