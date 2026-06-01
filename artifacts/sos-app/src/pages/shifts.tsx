import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListShifts, getListShiftsQueryKey,
  useCreateShift,
  useRespondToShift,
  useListUsers, getListUsersQueryKey,
  ShiftInput,
  ShiftResponseInput,
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
  scheduled: "bg-[#00AEEF]/10 text-[#00AEEF] border-[#00AEEF]/30",
  ongoing: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30",
  completed: "bg-white/5 text-white/30 border-white/10",
  cancelled: "bg-[#FF3B5C]/10 text-[#FF3B5C] border-[#FF3B5C]/30",
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
    createShift.mutate({ data: { ...data, tanodName } as ShiftInput }, {
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
    respondToShift.mutate({ id, data: { response } as ShiftResponseInput }, {
      onSuccess: () => {
        toast({ title: `Shift ${response}` });
        qc.invalidateQueries({ queryKey: getListShiftsQueryKey({}) });
      },
    });
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6 tactical-grid min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase text-white font-display flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#00AEEF]" />
              Patrol Shifts
            </h1>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mt-1">{Array.isArray(shifts) ? shifts.length : 0} shifts</p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-shift" size="sm" className="bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#040B1A] font-black text-[10px] uppercase tracking-widest">
                  <Plus className="w-4 h-4 mr-1" /> New Shift
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#040B1A] border-[#00F0FF]/20">
                <DialogHeader><DialogTitle className="text-white font-display">Create Shift</DialogTitle></DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="tanodId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] text-[#00F0FF] font-mono uppercase tracking-wider">Tanod</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-tanod" className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono">
                              <SelectValue placeholder="Select tanod" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#040B1A] border-[#00F0FF]/20">
                            {Array.isArray(tanods) && tanods.map((t: any) => (
                              <SelectItem key={t.id} value={t.id} className="text-white font-mono">{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="sector" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] text-[#00F0FF] font-mono uppercase tracking-wider">Sector</FormLabel>
                        <FormControl><Input data-testid="input-sector" placeholder="e.g. Zone 1, Purok 3" className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="startTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] text-[#00F0FF] font-mono uppercase tracking-wider">Start Time</FormLabel>
                        <FormControl><Input data-testid="input-start-time" type="datetime-local" className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="endTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] text-[#00F0FF] font-mono uppercase tracking-wider">End Time</FormLabel>
                        <FormControl><Input data-testid="input-end-time" type="datetime-local" className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={createShift.isPending} className="w-full bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#040B1A] font-black">
                      Create Shift
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 tactical-panel border-white/5 animate-pulse" />)}</div>
        ) : Array.isArray(shifts) && shifts.length === 0 ? (
          <div className="tactical-panel border-white/5 p-12 text-center">
            <Calendar className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/30 font-mono">No shifts scheduled</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.isArray(shifts) && shifts.map((s: any) => (
              <div key={s.id} data-testid={`card-shift-${s.id}`} className="tactical-panel border-white/5 rounded-[24px] px-4 py-3 flex items-center gap-4">
                <Calendar className="w-4 h-4 text-white/30 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{s.tanodName}</span>
                    <span className="text-xs text-white/30">—</span>
                    <span className="text-xs text-white/30">{s.sector}</span>
                    <Badge className={cn("text-[10px]", STATUS_COLOR[s.status])}>{s.status?.toUpperCase()}</Badge>
                    {s.tanodResponse && s.tanodResponse !== "pending" && (
                      <span className={cn("text-[10px]", s.tanodResponse === "accepted" ? "text-[#10B981]" : "text-[#FF3B5C]")}>{s.tanodResponse}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/30 mt-0.5 font-mono">
                    {new Date(s.startTime).toLocaleString()} – {new Date(s.endTime).toLocaleTimeString()}
                  </p>
                </div>
                {user?.role === "tanod" && s.tanodId === user.id && s.tanodResponse === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button data-testid={`button-accept-${s.id}`} size="sm" onClick={() => respond(s.id, "accepted")}
                      className="bg-[#10B981] hover:bg-[#10B981]/80 text-white text-[10px] h-7 px-2 font-black">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept
                    </Button>
                    <Button data-testid={`button-reject-${s.id}`} size="sm" variant="outline" onClick={() => respond(s.id, "rejected")}
                      className="border-[#FF3B5C]/30 text-[#FF3B5C] hover:bg-[#FF3B5C]/10 text-[10px] h-7 px-2 font-black">
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
