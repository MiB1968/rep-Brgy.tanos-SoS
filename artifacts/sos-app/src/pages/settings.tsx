import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { useUpdateUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const ROLE_COLOR: Record<string, string> = {
  resident: "bg-blue-900/30 text-blue-300",
  tanod: "bg-green-900/30 text-green-300",
  admin: "bg-amber-900/30 text-amber-300",
  superadmin: "bg-primary/20 text-primary",
};

export default function SettingsPage() {
  const { user, login, token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
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
    updateUser.mutate({ id: user.id, data } as any, {
      onSuccess: (updated: any) => {
        toast({ title: "Profile updated" });
        login({ ...user, ...updated }, token!);
      },
      onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
    });
  }

  return (
    <Layout>
      <div className="p-6 max-w-lg space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground">Manage your account</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-foreground uppercase">
            {user?.name?.[0] ?? "?"}
          </div>
          <div>
            <div className="font-semibold text-foreground">{user?.name}</div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium mt-1 inline-block", ROLE_COLOR[user?.role ?? "resident"])}>
              {user?.role}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Edit Profile</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase">Full Name</FormLabel>
                  <FormControl><Input data-testid="input-name" className="bg-background border-border" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase">Phone</FormLabel>
                  <FormControl><Input data-testid="input-phone" placeholder="+63 9xx xxx xxxx" className="bg-background border-border" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground uppercase">Address</FormLabel>
                  <FormControl><Input data-testid="input-address" placeholder="Street, Barangay" className="bg-background border-border" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button
                data-testid="button-save-profile"
                type="submit"
                disabled={updateUser.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {updateUser.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Account Info</h2>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Account ID</span>
              <span className="font-mono text-foreground/50">{user?.id?.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className="text-green-400">{user?.status ?? "active"}</span>
            </div>
            <div className="flex justify-between">
              <span>Role</span>
              <span>{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
