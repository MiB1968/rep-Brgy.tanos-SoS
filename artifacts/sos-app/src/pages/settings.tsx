import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { useUpdateUser, UserUpdate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const ROLE_COLOR: Record<string, string> = {
  resident: "bg-[#00AEEF]/10 text-[#00AEEF]",
  tanod: "bg-[#10B981]/10 text-[#10B981]",
  admin: "bg-[#F59E0B]/10 text-[#F59E0B]",
  superadmin: "bg-[#FF3B5C]/10 text-[#FF3B5C]",
};

export default function SettingsPage() {
  const { user, login, token } = useAuth();
  const { toast } = useToast();
  const updateUser = useUpdateUser();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      address: user?.address ?? "",
    },
  });

  function onSubmit(data: FormData) {
    if (!user?.id) return;
    updateUser.mutate({ id: user.id, data: data as UserUpdate }, {
      onSuccess: (updated: any) => {
        toast({ title: "Profile updated" });
        login({ ...user, ...updated }, token!);
      },
      onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
    });
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-lg space-y-6 tactical-grid min-h-screen">
        <div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase text-white font-display flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#00F0FF]" />
            Settings
          </h1>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mt-1">Manage your account</p>
        </div>

        <div className="tactical-panel border-white/5 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center text-lg font-bold text-[#00F0FF] uppercase">
            {user?.name?.[0] ?? "?"}
          </div>
          <div>
            <div className="font-semibold text-white">{user?.name}</div>
            <div className="text-xs text-white/30">{user?.email}</div>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium mt-1 inline-block font-mono", ROLE_COLOR[user?.role ?? "resident"])}>
              {user?.role}
            </span>
          </div>
        </div>

        <div className="tactical-panel border-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-4 font-mono uppercase tracking-wider">Edit Profile</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-[#00F0FF] font-mono uppercase tracking-wider">Full Name</FormLabel>
                  <FormControl><Input data-testid="input-name" className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-[#00F0FF] font-mono uppercase tracking-wider">Phone</FormLabel>
                  <FormControl><Input data-testid="input-phone" placeholder="+63 9xx xxx xxxx" className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-[#00F0FF] font-mono uppercase tracking-wider">Address</FormLabel>
                  <FormControl><Input data-testid="input-address" placeholder="Street, Barangay" className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button data-testid="button-save-profile" type="submit" disabled={updateUser.isPending}
                className="bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#040B1A] font-black uppercase tracking-widest text-xs">
                {updateUser.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="tactical-panel border-white/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-[#00F0FF]" />
            <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Account Info</h2>
          </div>
          <div className="space-y-2 text-[10px] font-mono text-white/30">
            <div className="flex justify-between">
              <span>Account ID</span>
              <span className="font-mono text-white/50">{user?.id?.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className="text-[#10B981]">{user?.status ?? "active"}</span>
            </div>
            <div className="flex justify-between">
              <span>Role</span>
              <span className="text-white/50">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
