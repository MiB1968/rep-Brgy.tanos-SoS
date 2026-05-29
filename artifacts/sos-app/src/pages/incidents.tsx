import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListIncidents, getListIncidentsQueryKey,
  useCreateIncident,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Plus, FileText } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-900/40 text-amber-300 border-amber-700",
  ongoing: "bg-blue-900/40 text-blue-300 border-blue-700",
  resolved: "bg-green-900/40 text-green-300 border-green-700",
  referred: "bg-purple-900/40 text-purple-300 border-purple-700",
};

const schema = z.object({
  type: z.string().min(1),
  location: z.string().min(1),
  description: z.string().min(1),
  citizenName: z.string().optional(),
  personsInvolved: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function IncidentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: incidents = [], isLoading } = useListIncidents(
    {},
    { query: { queryKey: getListIncidentsQueryKey({}) } }
  );

  const createIncident = useCreateIncident();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "", location: "", description: "", citizenName: "", personsInvolved: "" },
  });

  function onSubmit(data: FormData) {
    createIncident.mutate({ data } as any, {
      onSuccess: () => {
        toast({ title: "Incident reported" });
        setOpen(false);
        form.reset();
        qc.invalidateQueries({ queryKey: getListIncidentsQueryKey({}) });
      },
      onError: () => toast({ title: "Failed to create incident", variant: "destructive" }),
    });
  }

  return (
    <Layout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Incident Reports</h1>
            <p className="text-xs text-muted-foreground">{Array.isArray(incidents) ? incidents.length : 0} incidents</p>
          </div>
          {(user?.role === "tanod" || user?.role === "admin" || user?.role === "superadmin") && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-incident" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
                  <Plus className="w-4 h-4 mr-1" /> New Incident
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Report Incident</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase">Type</FormLabel>
                        <FormControl><Input data-testid="input-incident-type" placeholder="e.g. Theft, Fight" className="bg-background border-border" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase">Location</FormLabel>
                        <FormControl><Input data-testid="input-incident-location" placeholder="Street / landmark" className="bg-background border-border" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase">Description</FormLabel>
                        <FormControl><Input data-testid="input-incident-description" placeholder="Brief incident description" className="bg-background border-border" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="citizenName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground uppercase">Citizen Name (optional)</FormLabel>
                        <FormControl><Input data-testid="input-citizen-name" placeholder="Complainant name" className="bg-background border-border" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={createIncident.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      Submit Report
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-card border border-border rounded-lg animate-pulse" />)}</div>
        ) : Array.isArray(incidents) && incidents.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No incident reports yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.isArray(incidents) && incidents.map((inc: any) => (
              <div key={inc.id} data-testid={`card-incident-${inc.id}`} className="bg-card border border-border rounded-lg px-4 py-3 flex items-start gap-4">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{inc.type}</span>
                    <Badge className={cn("text-[10px]", STATUS_COLOR[inc.status])}>{inc.status?.toUpperCase()}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{inc.location} · {inc.tanodName}</p>
                  {inc.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{inc.description}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(inc.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
