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
import { Plus, FileText, AlertOctagon } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
  ongoing: "bg-[#00AEEF]/10 text-[#00AEEF] border-[#00AEEF]/30",
  resolved: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30",
  referred: "bg-[#A855F7]/10 text-[#A855F7] border-[#A855F7]/30",
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
      <div className="p-4 md:p-8 space-y-6 tactical-grid min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase text-white font-display flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-[#FF3B5C]" />
              Incident Reports
            </h1>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mt-1">{Array.isArray(incidents) ? incidents.length : 0} incidents</p>
          </div>
          {(user?.role === "tanod" || user?.role === "admin" || user?.role === "superadmin") && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-incident" size="sm" className="bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#040B1A] font-black text-[10px] uppercase tracking-widest">
                  <Plus className="w-4 h-4 mr-1" /> New Incident
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#040B1A] border-[#00F0FF]/20">
                <DialogHeader>
                  <DialogTitle className="text-white font-display">Report Incident</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] text-[#00F0FF] font-mono uppercase tracking-wider">Type</FormLabel>
                        <FormControl><Input data-testid="input-incident-type" placeholder="e.g. Theft, Fight" className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] text-[#00F0FF] font-mono uppercase tracking-wider">Location</FormLabel>
                        <FormControl><Input data-testid="input-incident-location" placeholder="Street / landmark" className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] text-[#00F0FF] font-mono uppercase tracking-wider">Description</FormLabel>
                        <FormControl><Input data-testid="input-incident-description" placeholder="Brief incident description" className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="citizenName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Citizen Name (optional)</FormLabel>
                        <FormControl><Input data-testid="input-citizen-name" placeholder="Complainant name" className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={createIncident.isPending} className="w-full bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#040B1A] font-black">
                      Submit Report
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 tactical-panel border-white/5 animate-pulse" />)}</div>
        ) : Array.isArray(incidents) && incidents.length === 0 ? (
          <div className="tactical-panel border-white/5 p-12 text-center">
            <FileText className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/30 font-mono">No incident reports yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.isArray(incidents) && incidents.map((inc: any) => (
              <div key={inc.id} data-testid={`card-incident-${inc.id}`} className="tactical-panel border-white/5 rounded-[24px] px-4 py-3 flex items-start gap-4 hover:border-[#00F0FF]/20 transition-all">
                <FileText className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{inc.type}</span>
                    <Badge className={cn("text-[10px]", STATUS_COLOR[inc.status])}>{inc.status?.toUpperCase()}</Badge>
                  </div>
                  <p className="text-[10px] text-white/30 mt-0.5 font-mono">{inc.location} · {inc.tanodName}</p>
                  {inc.description && <p className="text-[10px] text-white/30 truncate mt-0.5">{inc.description}</p>}
                  <p className="text-[10px] text-white/20 mt-1 font-mono">{new Date(inc.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
