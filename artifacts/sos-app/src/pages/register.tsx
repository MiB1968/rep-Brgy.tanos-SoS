import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield } from "lucide-react";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["resident", "tanod"]),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", role: "resident", phone: "", address: "" },
  });

  const onSubmit = (data: FormData) => {
    registerMutation.mutate({ data } as any, {
      onSuccess: (res: any) => {
        login(res.user, res.token);
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({ title: "Registration failed", description: err?.data?.error ?? "Could not register", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(0_84%_50%/0.05)_0%,_transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Request Access</h1>
          <p className="text-xs text-muted-foreground mt-1">Brgy Tanod S.O.S System</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wide text-muted-foreground">Full Name</FormLabel>
                  <FormControl><Input data-testid="input-name" placeholder="Juan dela Cruz" className="bg-background border-border" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wide text-muted-foreground">Email</FormLabel>
                  <FormControl><Input data-testid="input-email" type="email" placeholder="you@example.com" className="bg-background border-border" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wide text-muted-foreground">Password</FormLabel>
                  <FormControl><Input data-testid="input-password" type="password" placeholder="••••••••" className="bg-background border-border" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wide text-muted-foreground">Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-role" className="bg-background border-border">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="resident">Resident</SelectItem>
                      <SelectItem value="tanod">Tanod</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wide text-muted-foreground">Phone (optional)</FormLabel>
                  <FormControl><Input data-testid="input-phone" placeholder="+63 9xx xxx xxxx" className="bg-background border-border" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wide text-muted-foreground">Address (optional)</FormLabel>
                  <FormControl><Input data-testid="input-address" placeholder="Street, Barangay" className="bg-background border-border" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button
                data-testid="button-register"
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Registering..." : "Submit Registration"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Already registered?{" "}
          <Link href="/" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
