import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Keep data fresh for 5 minutes to reduce refetches
        staleTime: 5 * 60 * 1000,
        // Cache data for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Don't refetch on window focus to prevent unnecessary loads
        refetchOnWindowFocus: false,
        // Retry failed queries once
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Cache route data for 30 seconds to prevent refetch on navigation
    defaultPreloadStaleTime: 30 * 1000,
    // Preload on hover for faster navigation
    defaultPreload: "intent",
  });

  return router;
};
