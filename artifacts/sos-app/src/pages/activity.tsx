import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListTanodActivityLogs, getListTanodActivityLogsQueryKey,
  useCreateTanodActivityLog,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Activity, Plus } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  type: z.string().min(1),
  details: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

const TYPE_COLORS: Record<string, string> = {
  patrol: "text-green-400",
  response: "text-primary",
  report: "text-blue-400",
  other: "text-muted-foreground",
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
    createLog.mutate({ data } as any, {
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
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Activity Logs</h1>
            <p className="text-xs text-muted-foreground">{Array.isArray(logs) ? logs.length : 0} entries</p>
          </div>
          {(user?.role === "tanod") && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-log" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
                  <Plus className="w-4 h-4 mr-1" /> Log Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase">Type</FormLabel>
                        <FormControl><Input data-testid="input-log-type" placeholder="patrol / response / report" className="bg-background border-border" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="details" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase">Details</FormLabel>
                        <FormControl><Input data-testid="input-log-details" placeholder="Activity description" className="bg-background border-border" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={createLog.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      Submit Log
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-card border border-border rounded-lg animate-pulse" />)}</div>
        ) : Array.isArray(logs) && logs.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No activity logs yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.isArray(logs) && logs.map((l: any) => (
              <div key={l.id} data-testid={`card-log-${l.id}`} className="bg-card border border-border rounded-lg px-4 py-3 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{l.tanodName}</span>
                    <span className={`text-xs font-medium ${TYPE_COLORS[l.type] ?? "text-muted-foreground"}`}>{l.type}</span>
                  </div>
                  <p className="text-xs text-foreground/80 mt-0.5">{l.details}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(l.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
