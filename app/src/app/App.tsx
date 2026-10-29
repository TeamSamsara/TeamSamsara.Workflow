// File : /TeamSamsara.Workflow/app/src/app/App.tsx
// Version : 1.3.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : The provider stack every page sits in, outermost first: the crash
// screen, server data, the workspace, the theme (which defaults to the
// workspace's), the session, permissions, toasts, then the router.

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { RouterProvider } from "react-router-dom";
import { AccessProvider } from "@/core/access";
import { SessionProvider } from "@/core/session";
import { ThemeProvider } from "@/core/theme";
import { useWorkspace, WorkspaceProvider } from "@/core/workspace";
import { queryClient } from "@/lib/queryClient";
import { ToastProvider } from "@/shared/components/Toast/ToastProvider";
import { AppErrorFallback } from "./AppErrorFallback";
import { router } from "./router";

/** The theme, defaulting to the workspace's choice for people who haven't picked one. */
function WorkspaceThemeProvider({ children }: { children: ReactNode }) {
  const workspace = useWorkspace();
  const defaultChoice =
    workspace.status === "ready" ? workspace.workspace.defaultTheme : undefined;
  return (
    <ThemeProvider defaultChoice={defaultChoice}>{children}</ThemeProvider>
  );
}

export function App() {
  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <WorkspaceProvider>
          <WorkspaceThemeProvider>
            <SessionProvider>
              <AccessProvider>
                <ToastProvider>
                  <RouterProvider router={router} />
                </ToastProvider>
              </AccessProvider>
            </SessionProvider>
          </WorkspaceThemeProvider>
        </WorkspaceProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
