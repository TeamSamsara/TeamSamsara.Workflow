// File : /TeamSamsara.Workflow/app/src/app/App.tsx
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The provider stack every page sits in, outermost first: the crash
// screen, server data, the theme, toasts, then the router with the pages.

import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { RouterProvider } from "react-router-dom";
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
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
