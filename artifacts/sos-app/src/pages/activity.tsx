import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListTanodActivityLogs, getListTanodActivityLogsQueryKey,
  useCreateTanodActivityLog,
  TanodActivityLogInput,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Activity, Plus, History } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  type: z.string().min(1),
  details: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

const TYPE_COLORS: Record<string, string> = {
  patrol: "text-[#10B981]",
  response: "text-[#00F0FF]",
  report: "text-[#00AEEF]",
  other: "text-white/30",
};

export default function ActivityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: logs = [], isLoading } = useListTanodActivityLogs(
    {},
    { query: { queryKey: getListTanodActivityLogsQueryKey({}) } }
  );

  const createLog = useCreateTanodActivityLog();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "patrol", details: "" },
  });

  function onSubmit(data: FormData) {
    createLog.mutate({ data: data as TanodActivityLogInput }, {
      onSuccess: () => {
        toast({ title: "Activity logged" });
        setOpen(false);
        form.reset();
        qc.invalidateQueries({ queryKey: getListTanodActivityLogsQueryKey({}) });
      },
    });
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6 tactical-grid min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase text-white font-display flex items-center gap-2">
              <History className="w-5 h-5 text-[#00F0FF]" />
              Activity Logs
            </h1>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mt-1">{Array.isArray(logs) ? logs.length : 0} entries</p>
          </div>
          {(user?.role === "tanod") && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-log" size="sm" className="bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#040B1A] font-black text-[10px] uppercase tracking-widest">
                  <Plus className="w-4 h-4 mr-1" /> Log Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#040B1A] border-[#00F0FF]/20">
                <DialogHeader><DialogTitle className="text-white font-display">Log Activity</DialogTitle></DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] text-[#00F0FF] font-mono uppercase tracking-wider">Type</FormLabel>
                        <FormControl><Input data-testid="input-log-type" placeholder="patrol / response / report" className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="details" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] text-[#00F0FF] font-mono uppercase tracking-wider">Details</FormLabel>
                        <FormControl><Input data-testid="input-log-details" placeholder="Activity description" className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={createLog.isPending} className="w-full bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#040B1A] font-black">
                      Submit Log
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 tactical-panel border-white/5 animate-pulse" />)}</div>
        ) : Array.isArray(logs) && logs.length === 0 ? (
          <div className="tactical-panel border-white/5 p-12 text-center">
            <Activity className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/30 font-mono">No activity logs yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.isArray(logs) && logs.map((l: any) => (
              <div key={l.id} data-testid={`card-log-${l.id}`} className="tactical-panel border-white/5 rounded-[24px] px-4 py-3 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] mt-2 flex-shrink-0 shadow-[0_0_6px_#00F0FF]" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{l.tanodName}</span>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${TYPE_COLORS[l.type] ?? "text-white/30"}`}>{l.type}</span>
                  </div>
                  <p className="text-xs text-white/70 mt-0.5">{l.details}</p>
                  <p className="text-[10px] text-white/20 mt-1 font-mono">{new Date(l.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
