"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * App-wide TanStack Query provider. The client is created once per browser
 * session via `useState` so it survives re-renders but isn't shared between
 * requests on the server.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Treat data as fresh for a minute so revisiting a view (e.g. the
            // same search filters) serves instantly from cache without refetch.
            staleTime: 60_000,
            // Keep unused results around for 5 minutes for back/forward nav.
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
