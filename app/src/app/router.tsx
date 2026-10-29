// File : /TeamSamsara.Workflow/app/src/app/router.tsx
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : Every route in the app. Layouts and the not-found page load with the
// app; every other page loads only when it is first opened. Pages not built yet show ComingSoonView, and each
// feature PR swaps its own in.

import { createBrowserRouter, Navigate } from "react-router-dom";
import { RoutePaths } from "@/shared/constants/routePaths";
import { NotFoundView } from "@/views/system/NotFoundView";
import { AppLoading } from "./AppLoading";
import { AppLayout } from "./layouts/AppLayout/AppLayout";
import { AuthLayout } from "./layouts/AuthLayout/AuthLayout";
import { SettingsLayout } from "./layouts/SettingsLayout/SettingsLayout";
import { RouteError } from "./RouteError";

// #region Page loaders
const comingSoonView = () =>
  import("@/views/system/ComingSoonView").then((module) => ({
    Component: module.ComingSoonView,
  }));
// #endregion

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <AppLoading />,
    children: [
      { path: RoutePaths.calendar, lazy: comingSoonView },
      { path: RoutePaths.myTasks, lazy: comingSoonView },
      { path: RoutePaths.workflows, lazy: comingSoonView },
      { path: RoutePaths.account, lazy: comingSoonView },
      {
        path: RoutePaths.settings,
        element: <SettingsLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={RoutePaths.settingsGeneral} replace />,
          },
          { path: RoutePaths.settingsGeneral, lazy: comingSoonView },
          { path: RoutePaths.settingsMembers, lazy: comingSoonView },
          { path: RoutePaths.settingsRoles, lazy: comingSoonView },
          { path: RoutePaths.settingsGroups, lazy: comingSoonView },
          { path: RoutePaths.settingsPlatforms, lazy: comingSoonView },
          { path: RoutePaths.settingsTaskSetup, lazy: comingSoonView },
        ],
      },
      { path: RoutePaths.notFound, element: <NotFoundView /> },
    ],
  },
  {
    element: <AuthLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <AppLoading />,
    children: [{ path: RoutePaths.signIn, lazy: comingSoonView }],
  },
]);
