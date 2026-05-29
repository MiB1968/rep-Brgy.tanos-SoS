import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListShifts, getListShiftsQueryKey,
  useCreateShift,
  useRespondToShift,
  useListUsers, getListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Calendar, Plus, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  tanodId: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  sector: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STATUS_COLOR: Record<string, string> = {
  scheduled: "bg-blue-900/40 text-blue-300 border-blue-700",
  ongoing: "bg-green-900/40 text-green-300 border-green-700",
  completed: "bg-gray-700/40 text-gray-400 border-gray-600",
  cancelled: "bg-red-900/40 text-red-300 border-red-700",
};

export default function ShiftsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const { data: shifts = [], isLoading } = useListShifts(
    {},
    { query: { queryKey: getListShiftsQueryKey({}) } }
  );

  const { data: tanods = [] } = useListUsers(
    { role: "tanod" },
    { query: { queryKey: getListUsersQueryKey({ role: "tanod" }), enabled: isAdmin } }
  );

  const createShift = useCreateShift();
  const respondToShift = useRespondToShift();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tanodId: "", startTime: "", endTime: "", sector: "", notes: "" },
  });

  function onSubmit(data: FormData) {
    const tanodName = Array.isArray(tanods)
      ? (tanods as any[]).find(t => t.id === data.tanodId)?.name ?? ""
      : "";
    createShift.mutate({ data: { ...data, tanodName } } as any, {
      onSuccess: () => {
        toast({ title: "Shift created" });
        setOpen(false);
        form.reset();
        qc.invalidateQueries({ queryKey: getListShiftsQueryKey({}) });
      },
      onError: () => toast({ title: "Failed to create shift", variant: "destructive" }),
    });
  }

  function respond(id: string, response: string) {
    respondToShift.mutate({ id, data: { response } } as any, {
      onSuccess: () => {
        toast({ title: `Shift ${response}` });
        qc.invalidateQueries({ queryKey: getListShiftsQueryKey({}) });
      },
    });
  }

  return (
    <Layout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Patrol Shifts</h1>
            <p className="text-xs text-muted-foreground">{Array.isArray(shifts) ? shifts.length : 0} shifts</p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-shift" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
                  <Plus className="w-4 h-4 mr-1" /> New Shift
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Create Shift</DialogTitle></DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="tanodId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase">Tanod</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-tanod" className="bg-background border-border">
                              <SelectValue placeholder="Select tanod" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(tanods) && tanods.map((t: any) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="sector" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase">Sector</FormLabel>
                        <FormControl><Input data-testid="input-sector" placeholder="e.g. Zone 1, Purok 3" className="bg-background border-border" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="startTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase">Start Time</FormLabel>
                        <FormControl><Input data-testid="input-start-time" type="datetime-local" className="bg-background border-border" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="endTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase">End Time</FormLabel>
                        <FormControl><Input data-testid="input-end-time" type="datetime-local" className="bg-background border-border" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={createShift.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      Create Shift
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-card border border-border rounded-lg animate-pulse" />)}</div>
        ) : Array.isArray(shifts) && shifts.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No shifts scheduled</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.isArray(shifts) && shifts.map((s: any) => (
              <div key={s.id} data-testid={`card-shift-${s.id}`} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-4">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{s.tanodName}</span>
                    <span className="text-xs text-muted-foreground">—</span>
                    <span className="text-xs text-muted-foreground">{s.sector}</span>
                    <Badge className={cn("text-[10px]", STATUS_COLOR[s.status])}>{s.status?.toUpperCase()}</Badge>
                    {s.tanodResponse && s.tanodResponse !== "pending" && (
                      <span className={cn("text-[10px]", s.tanodResponse === "accepted" ? "text-green-400" : "text-red-400")}>{s.tanodResponse}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(s.startTime).toLocaleString()} – {new Date(s.endTime).toLocaleTimeString()}
                  </p>
                </div>
                {user?.role === "tanod" && s.tanodId === user.id && s.tanodResponse === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      data-testid={`button-accept-${s.id}`}
                      size="sm"
                      onClick={() => respond(s.id, "accepted")}
                      className="bg-green-700 hover:bg-green-600 text-white text-xs h-7 px-2"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept
                    </Button>
                    <Button
                      data-testid={`button-reject-${s.id}`}
                      size="sm"
                      variant="outline"
                      onClick={() => respond(s.id, "rejected")}
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
