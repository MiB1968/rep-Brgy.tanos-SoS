import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, AlertTriangle, Zap, Eye, EyeOff } from "lucide-react";
import { useLogin, type LoginMutationResult, type LoginMutationError } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res: LoginMutationResult) => {
        login(res.user as any, res.token);
        setLocation("/dashboard");
      },
      onError: (err: LoginMutationError) => {
        toast({ title: "Login failed", description: (err as any)?.data?.error ?? "Invalid credentials", variant: "destructive" });
      },
    });
  };

  const handleDemoLogin = (email: string, pass: string) => {
    form.setValue("email", email);
    form.setValue("password", pass);
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className="min-h-screen bg-[#040B1A] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,240,255,0.08)_0%,_transparent_60%)] pointer-events-none" />
      <div className="absolute top-10 right-10 w-64 h-64 bg-[#00F0FF]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center mb-4 animate-pulse-glow">
            <Shield className="w-8 h-8 text-[#00F0FF]" />
          </div>
          <h1 className="text-xl font-black text-white tracking-wider font-display uppercase">BRGY TANOD S.O.S</h1>
          <p className="text-[9px] text-[#00F0FF] font-mono uppercase tracking-[0.4em] mt-1">Emergency Response System</p>
        </div>

        <div className="tactical-panel p-6 border-[#00F0FF]/20">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#00F0FF]/10">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-[10px] font-black text-[#F59E0B] uppercase tracking-[0.3em] font-mono">Authorized Personnel Only</span>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-[0.2em] text-[#00F0FF] font-mono font-bold">Email Address</FormLabel>
                  <FormControl>
                    <Input data-testid="input-email" type="email" placeholder="you@example.com" className="bg-[#040B1A] border-[#00F0FF]/20 text-white placeholder:text-white/20 font-mono" {...field} />
                  </FormControl>
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

              <Button
                data-testid="button-login"
                type="submit"
                className="w-full bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#040B1A] font-black uppercase tracking-widest text-xs"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Authenticating..." : "Access System"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-[10px] text-white/30 mt-4 font-mono">
          Not registered?{" "}
          <Link href="/register" className="text-[#00F0FF] hover:underline">Request access</Link>
        </p>

        <div className="mt-6 tactical-panel p-3 border-white/5">
          <p className="text-[10px] text-white/30 text-center mb-2 font-bold font-mono uppercase tracking-widest">Demo Accounts (Click to Fill)</p>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-white/20 font-mono">
            <button onClick={() => handleDemoLogin("admin@brgy.ph", "admin123")} className="flex items-center gap-1 hover:bg-white/5 p-1 rounded transition-colors text-left">
              <Shield className="w-3 h-3 text-[#F59E0B]" /> admin@brgy.ph
            </button>
            <button onClick={() => handleDemoLogin("tanod@brgy.ph", "tanod123")} className="flex items-center gap-1 hover:bg-white/5 p-1 rounded transition-colors text-left">
              <Shield className="w-3 h-3 text-[#10B981]" /> tanod@brgy.ph
            </button>
            <button onClick={() => handleDemoLogin("resident@brgy.ph", "resident123")} className="flex items-center gap-1 hover:bg-white/5 p-1 rounded transition-colors text-left">
              <Shield className="w-3 h-3 text-[#00AEEF]" /> resident@brgy.ph
            </button>
            <button onClick={() => handleDemoLogin("super@brgy.ph", "super123")} className="flex items-center gap-1 hover:bg-white/5 p-1 rounded transition-colors text-left">
              <Shield className="w-3 h-3 text-[#FF3B5C]" /> super@brgy.ph
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
