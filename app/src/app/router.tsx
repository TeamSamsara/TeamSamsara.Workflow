// File : /TeamSamsara.Workflow/app/src/app/router.tsx
// Version : 1.2.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : Every route in the app. Layouts and the not-found page load with the
// app; every other page loads only when it is first opened. Pages not built yet show ComingSoonView, and each
// feature PR swaps its own in.

import { createBrowserRouter, Navigate } from "react-router-dom";
import { RedirectIfSignedIn, RequireSignedIn } from "@/core/session";
import { RoutePaths } from "@/shared/constants/routePaths";
import { NotFoundView } from "@/views/system/NotFoundView";
import { AppLoading } from "./AppLoading";
import { AppLayout } from "./layouts/AppLayout/AppLayout";
import { AuthLayout } from "./layouts/AuthLayout/AuthLayout";
import { SettingsLayout } from "./layouts/SettingsLayout/SettingsLayout";
import { RouteError } from "./RouteError";

// #region Page loaders
const signInView = () =>
  import("@/views/auth/SignInView").then((module) => ({
    Component: module.SignInView,
  }));

const forgotPasswordView = () =>
  import("@/views/auth/ForgotPasswordView").then((module) => ({
    Component: module.ForgotPasswordView,
  }));

const checkInboxView = () =>
  import("@/views/auth/CheckInboxView").then((module) => ({
    Component: module.CheckInboxView,
  }));

const emailLinkView = () =>
  import("@/views/auth/EmailLinkView").then((module) => ({
    Component: module.EmailLinkView,
  }));

const linkExpiredView = () =>
  import("@/views/auth/LinkExpiredView").then((module) => ({
    Component: module.LinkExpiredView,
  }));

const noAccessView = () =>
  import("@/views/auth/NoAccessView").then((module) => ({
    Component: module.NoAccessView,
  }));

const comingSoonView = () =>
  import("@/views/system/ComingSoonView").then((module) => ({
    Component: module.ComingSoonView,
  }));
// #endregion

export const router = createBrowserRouter([
  {
    // Signed-in pages: only an active member gets past RequireSignedIn.
    element: <RequireSignedIn />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <AppLoading />,
    children: [
      {
        element: <AppLayout />,
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
    ],
  },
  {
    element: <AuthLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <AppLoading />,
    children: [
      {
        // Sign-in pages: an active member is sent on to the app.
        element: <RedirectIfSignedIn />,
        children: [
          { path: RoutePaths.signIn, lazy: signInView },
          { path: RoutePaths.forgotPassword, lazy: forgotPasswordView },
          { path: RoutePaths.checkInbox, lazy: checkInboxView },
          { path: RoutePaths.linkExpired, lazy: linkExpiredView },
        ],
      },
      // Open in any state: an email link can be opened while signed in, and
      // No access is where a signed-in account without access is sent.
      { path: RoutePaths.emailLink, lazy: emailLinkView },
      { path: RoutePaths.noAccess, lazy: noAccessView },
    ],
  },
]);
