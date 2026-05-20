import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/choose-package")({
  head: () => ({ meta: [{ title: "Choose a package — Meta Orbit Agency" }] }),
  component: ChoosePackage,
});

interface Pkg {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  daily_task_limit: number;
  max_earnings: number | null;
  benefits: string[];
  display_order: number;
}

function ChoosePackage() {
  const { profile, refresh } = useAuth();
  const navigate = useNavigate();
  const [activating, setActivating] = useState<string | null>(null);

  const { data: packages } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("packages").select("*").eq("is_active", true).order("display_order");
      if (error) throw error;
      return data as Pkg[];
    },
  });

  const handleActivate = async (pkg: Pkg) => {
    if (!profile) return;
    setActivating(pkg.id);
    const reference = `MO-${profile.id.slice(0, 8)}-${Date.now()}`;
    const { error } = await supabase.from("payments").insert({
      user_id: profile.user_id,
      package_id: pkg.id,
      amount: pkg.price,
      phone: profile.phone,
      reference,
      status: "pending",
    });
    if (error) { setActivating(null); toast.error(error.message); return; }
    
    // Store reference in sessionStorage so payment-success can access it
    sessionStorage.setItem("mo_pending_payment_ref", reference);
    sessionStorage.setItem("mo_pending_package_id", pkg.id);
    
    // Build callback URL to redirect back after payment
    // Paynecta will append status to this URL when redirecting back
    const callbackUrl = `${window.location.origin}/payment-success?reference=${encodeURIComponent(reference)}`;
    const paymentLink = `https://paynecta.co.ke/pay/metaorbit?reference=${encodeURIComponent(reference)}&amount=${pkg.price}&redirect_url=${encodeURIComponent(callbackUrl)}&return_url=${encodeURIComponent(callbackUrl)}&callback_url=${encodeURIComponent(callbackUrl)}`;
    
    await refresh();
    toast.success("Redirecting to Paynecta…");
    window.location.href = paymentLink;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/10"><Sparkles className="mr-1.5 h-3 w-3" />Activate your account</Badge>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Choose your package</h1>
        <p className="mt-2 text-muted-foreground">Pick a plan to unlock daily tasks and start earning. Pay securely via Paynecta.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {(packages ?? []).map((pkg, i) => {
          const featured = i === 2;
          return (
            <Card key={pkg.id} className={`relative flex flex-col ${featured ? "border-primary shadow-glow" : ""} bg-gradient-card`}>
              {featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-orbit px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</div>}
              <CardHeader>
                <CardTitle className="font-display text-xl">{pkg.name}</CardTitle>
                <div className="mt-2">
                  <span className="font-display text-3xl font-bold">KES {Number(pkg.price).toFixed(0)}</span>
                  <span className="text-sm text-muted-foreground"> / {pkg.duration_days} days</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="space-y-2 text-sm">
                  {pkg.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-success" />{b}</li>
                  ))}
                </ul>
                <Button
                  className={`mt-6 w-full ${featured ? "bg-gradient-orbit text-primary-foreground shadow-glow" : ""}`}
                  variant={featured ? "default" : "outline"}
                  disabled={activating === pkg.id}
                  onClick={() => handleActivate(pkg)}
                >
                  {activating === pkg.id ? "Redirecting…" : "Activate Package"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">After payment, you will be redirected back and your account will be activated automatically.</p>
    </div>
  );
}
