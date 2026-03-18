import { useState } from "react";
import { Link } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Register() {
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await registerMutation.mutateAsync({
        data: { ...formData, role: "parent" }
      });
      login(res);
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err?.data?.error || err?.message || "Please check your inputs",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 transform rotate-3">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground">Join AYA</h1>
          <p className="mt-2 text-muted-foreground text-lg">Start your family's AI journey today</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card p-8 rounded-[2rem] shadow-2xl shadow-black/5 border border-border/50 space-y-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2 ml-1">Parent Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                className="w-full px-5 py-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2 ml-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                className="w-full px-5 py-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="jane@family.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2 ml-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                className="w-full px-5 py-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="Min. 6 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full flex justify-center items-center gap-2 px-6 py-4 rounded-2xl font-bold text-lg bg-foreground text-background shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:opacity-50"
          >
            {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
          </button>

          <p className="text-center text-sm text-muted-foreground pt-4">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
