// File : /TeamSamsara.Workflow/app/src/app/App.tsx
// Version : 1.1.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : The provider stack every page sits in, outermost first: the crash
// screen, server data, the theme, the session, toasts, then the router.

import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { RouterProvider } from "react-router-dom";
import { SessionProvider } from "@/core/session";
import { ThemeProvider } from "@/core/theme";
import { queryClient } from "@/lib/queryClient";
import { ToastProvider } from "@/shared/components/Toast/ToastProvider";
import { AppErrorFallback } from "./AppErrorFallback";
import { router } from "./router";

export function App() {
  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SessionProvider>
            <ToastProvider>
              <RouterProvider router={router} />
            </ToastProvider>
          </SessionProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
