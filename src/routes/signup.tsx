import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { MetaOrbitWordmark } from "@/components/MetaOrbitLogo";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({ ref: (s.ref as string) || "" }),
  head: () => ({ meta: [{ title: "Sign up — Meta Orbit Agency" }, { name: "description", content: "Create your Meta Orbit Agency account in seconds." }] }),
  component: SignupPage,
});

function toEmail(input: string) {
  return input.includes("@") ? input : `${input.trim()}@metaorbit.local`;
}

function SignupPage() {
  const navigate = useNavigate();
  const { ref } = Route.useSearch();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState(ref);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    const email = toEmail(username);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { username: username.trim(), phone, referral_code: referral.trim().toUpperCase() },
      },
    });
    if (error) { 
      setLoading(false);
      toast.error(error.message); 
      return; 
    }
    toast.success("Account created — redirecting to packages...");
    
    // Use router navigation for smooth transition
    navigate({ to: "/choose-package" });
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
      <Card className="relative w-full max-w-md border-border/60 bg-card/80 p-8 backdrop-blur shadow-card">
        <div className="mb-6 flex justify-center"><MetaOrbitWordmark /></div>
        <h1 className="text-center font-display text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Free to join · activate any time</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="u">Username</Label>
            <Input id="u" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username or phone" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p">Phone</Label>
            <Input id="p" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r">Referral code (optional)</Label>
            <Input id="r" value={referral} onChange={(e) => setReferral(e.target.value.toUpperCase())} placeholder="ABCD1234" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-orbit text-primary-foreground shadow-glow">
            {loading ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="font-medium text-foreground hover:underline">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
