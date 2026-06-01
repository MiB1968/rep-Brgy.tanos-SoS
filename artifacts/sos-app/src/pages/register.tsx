import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, UserPlus, Eye, EyeOff } from "lucide-react";
import { useRegister, type RegisterMutationResult, type RegisterMutationError } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", role: "resident", phone: "", address: "" },
  });

  const onSubmit = (data: FormData) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res: RegisterMutationResult) => {
        login(res.user as any, res.token);
        setLocation("/dashboard");
      },
      onError: (err: RegisterMutationError) => {
        toast({ title: "Registration failed", description: (err as any)?.data?.error ?? "Could not register", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#040B1A] flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,240,255,0.08)_0%,_transparent_60%)] pointer-events-none" />
      <div className="absolute top-10 right-10 w-64 h-64 bg-[#00F0FF]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center mb-4 animate-pulse-glow">
            <Shield className="w-8 h-8 text-[#00F0FF]" />
          </div>
          <h1 className="text-xl font-black text-white tracking-wider font-display uppercase">Request Access</h1>
          <p className="text-[9px] text-[#00F0FF] font-mono uppercase tracking-[0.4em] mt-1">Brgy Tanod S.O.S System</p>
        </div>

        <div className="tactical-panel p-6 border-[#00F0FF]/20">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#00F0FF]/10">
            <UserPlus className="w-4 h-4 text-[#10B981]" />
            <span className="text-[10px] font-black text-[#10B981] uppercase tracking-[0.3em] font-mono">New Personnel Registration</span>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-[0.2em] text-[#00F0FF] font-mono font-bold">Full Name</FormLabel>
                  <FormControl><Input data-testid="input-name" placeholder="Juan dela Cruz" className="bg-[#040B1A] border-[#00F0FF]/20 text-white placeholder:text-white/20 font-mono" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-[0.2em] text-[#00F0FF] font-mono font-bold">Email</FormLabel>
                  <FormControl><Input data-testid="input-email" type="email" placeholder="you@example.com" className="bg-[#040B1A] border-[#00F0FF]/20 text-white placeholder:text-white/20 font-mono" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-[0.2em] text-[#00F0FF] font-mono font-bold">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input data-testid="input-password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="bg-[#040B1A] border-[#00F0FF]/20 text-white placeholder:text-white/20 font-mono" {...field} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-[0.2em] text-[#00F0FF] font-mono font-bold">Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-role" className="bg-[#040B1A] border-[#00F0FF]/20 text-white font-mono">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#040B1A] border-[#00F0FF]/20">
                      <SelectItem value="resident" className="text-white font-mono">Resident</SelectItem>
                      <SelectItem value="tanod" className="text-white font-mono">Tanod</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono font-bold">Phone (optional)</FormLabel>
                  <FormControl><Input data-testid="input-phone" placeholder="+63 9xx xxx xxxx" className="bg-[#040B1A] border-[#00F0FF]/20 text-white placeholder:text-white/20 font-mono" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono font-bold">Address (optional)</FormLabel>
                  <FormControl><Input data-testid="input-address" placeholder="Street, Barangay" className="bg-[#040B1A] border-[#00F0FF]/20 text-white placeholder:text-white/20 font-mono" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button
                data-testid="button-register"
                type="submit"
                className="w-full bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#040B1A] font-black uppercase tracking-widest text-xs"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Registering..." : "Submit Registration"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-[10px] text-white/30 mt-4 font-mono">
          Already registered?{" "}
          <Link href="/" className="text-[#00F0FF] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
