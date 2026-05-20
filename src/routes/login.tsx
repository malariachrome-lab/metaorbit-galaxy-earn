import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { MetaOrbitWordmark } from "@/components/MetaOrbitLogo";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Meta Orbit Agency" }, { name: "description", content: "Sign in to your Meta Orbit Agency account." }] }),
  component: LoginPage,
});

function toEmail(input: string) {
  return input.includes("@") ? input : `${input.trim()}@metaorbit.local`;
}

function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: toEmail(identifier), password });
    if (error) { 
      setLoading(false);
      toast.error(error.message); 
      return; 
    }
    
    // Check for admin role
    let targetRoute = "/dashboard";
    if (data.user) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      if (roles?.some((r) => r.role === "admin")) {
        targetRoute = "/admin";
      }
    }
    
    toast.success("Welcome back! Redirecting...");
    
    // Use router navigation for smooth transition without full page reload
    navigate({ to: targetRoute });
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
      <Card className="relative w-full max-w-md border-border/60 bg-card/80 p-8 backdrop-blur shadow-card">
        <div className="mb-6 flex justify-center"><MetaOrbitWordmark /></div>
        <h1 className="text-center font-display text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Sign in to continue earning</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="id">Username or email</Label>
            <Input id="id" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="0112973841 or you@email.com" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="pw">Password</Label>
              <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot?</Link>
            </div>
            <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-orbit text-primary-foreground shadow-glow">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account? <Link to="/signup" className="font-medium text-foreground hover:underline">Sign up</Link>
        </p>
      </Card>
    </div>
  );
}
