import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { SiteHeader } from "@/components/SiteHeader";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-orbit">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Lost in orbit</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page drifted out of range.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-gradient-orbit px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow">Back home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went sideways</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message || "Unknown error"}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-gradient-orbit px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
          <a href="/" className="rounded-md border px-4 py-2 text-sm font-medium">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Meta Orbit Agency — Earn by completing tasks" },
      { name: "description", content: "Meta Orbit Agency lets you earn rewards by watching videos, reading articles, viewing images, and visiting websites. Activate a package and start earning today." },
      { name: "author", content: "Meta Orbit Agency" },
      { property: "og:title", content: "Meta Orbit Agency — Earn by completing tasks" },
      { property: "og:description", content: "Meta Orbit Agency lets you earn rewards by watching videos, reading articles, viewing images, and visiting websites. Activate a package and start earning today." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Meta Orbit Agency — Earn by completing tasks" },
      { name: "twitter:description", content: "Meta Orbit Agency lets you earn rewards by watching videos, reading articles, viewing images, and visiting websites. Activate a package and start earning today." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2a1c289e-f5b5-4d7c-9309-0ea39d0900ee/id-preview-7a9b7aaa--5bea03b6-d37e-47aa-beea-20466c790ecc.lovable.app-1779255705723.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2a1c289e-f5b5-4d7c-9309-0ea39d0900ee/id-preview-7a9b7aaa--5bea03b6-d37e-47aa-beea-20466c790ecc.lovable.app-1779255705723.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthCacheInvalidator() {
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Only invalidate on significant auth events, not on every state change
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        // Use a small delay to batch rapid auth state changes
        const timeoutId = setTimeout(() => {
          router.invalidate();
          qc.invalidateQueries();
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    });
    return () => subscription.unsubscribe();
  }, [router, qc]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AuthCacheInvalidator />
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1"><Outlet /></main>
          </div>
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
