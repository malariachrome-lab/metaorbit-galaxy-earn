import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    // Use getSession first (fast, from localStorage cache)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Session exists and is valid, proceed
      return;
    }
    
    // No cached session - redirect to login
    throw redirect({ to: "/login", search: { redirect: location.href } as any });
  },
  component: () => <Outlet />,
});
