// File : /TeamSamsara.Workflow/app/src/lib/queryClient.ts
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The one React Query client, with the defaults every query shares.
// Live Firestore data updates itself, so queries do not refetch on focus.

import { QueryClient } from "@tanstack/react-query";

const thirtySecondsMs = 30_000;
const retriesBeforeError = 1;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: thirtySecondsMs,
      retry: retriesBeforeError,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
