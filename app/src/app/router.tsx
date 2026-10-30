// File : /TeamSamsara.Workflow/app/src/app/router.tsx
// Version : 1.9.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : Every route in the app. Layouts and the not-found page load with the
// app; every other page loads only when it is first opened. Pages not built yet show ComingSoonView, and each
// feature PR swaps its own in.

import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom";
import {
  ManagePermissions,
  RequirePermission,
  type PermissionKey,
} from "@/core/access";
import { RedirectIfSignedIn, RequireSignedIn } from "@/core/session";
import { RequireWorkspace } from "@/core/workspace";
import {
  RoleTabs,
  RoutePaths,
  type RoutePath,
} from "@/shared/constants/routePaths";
import { ForbiddenView } from "@/views/system/ForbiddenView";
import { NotFoundView } from "@/views/system/NotFoundView";
import { AppLoading } from "./AppLoading";
import { AppLayout } from "./layouts/AppLayout/AppLayout";
import {
  AuthLayout,
  type AuthLayoutHandle,
} from "./layouts/AuthLayout/AuthLayout";
import { SettingsIndexRedirect } from "./layouts/SettingsLayout/SettingsIndexRedirect";
import { SettingsLayout } from "./layouts/SettingsLayout/SettingsLayout";
import { settingsNav } from "./layouts/SettingsLayout/settingsNav";
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

const setupView = () =>
  import("@/views/setup/SetupView").then((module) => ({
    Component: module.SetupView,
  }));

const rolesView = () =>
  import("@/views/settings/roles/RolesView").then((module) => ({
    Component: module.RolesView,
  }));

const roleDisplayView = () =>
  import("@/views/settings/roles/RoleDisplayView").then((module) => ({
    Component: module.RoleDisplayView,
  }));

const rolePermissionsView = () =>
  import("@/views/settings/roles/RolePermissionsView").then((module) => ({
    Component: module.RolePermissionsView,
  }));

const workGroupsView = () =>
  import("@/views/settings/groups/WorkGroupsView").then((module) => ({
    Component: module.WorkGroupsView,
  }));

const membersView = () =>
  import("@/views/settings/members/MembersView").then((module) => ({
    Component: module.MembersView,
  }));

const memberView = () =>
  import("@/views/settings/members/MemberView").then((module) => ({
    Component: module.MemberView,
  }));

const roleMembersView = () =>
  import("@/views/settings/roles/RoleMembersView").then((module) => ({
    Component: module.RoleMembersView,
  }));

const generalSettingsView = () =>
  import("@/views/settings/general/GeneralSettingsView").then((module) => ({
    Component: module.GeneralSettingsView,
  }));

const platformsView = () =>
  import("@/views/settings/platforms/PlatformsView").then((module) => ({
    Component: module.PlatformsView,
  }));

const workflowsView = () =>
  import("@/views/workflows/WorkflowsView").then((module) => ({
    Component: module.WorkflowsView,
  }));

const workflowEditView = () =>
  import("@/views/workflows/WorkflowEditView").then((module) => ({
    Component: module.WorkflowEditView,
  }));

const taskSetupView = () =>
  import("@/views/settings/task-setup/TaskSetupView").then((module) => ({
    Component: module.TaskSetupView,
  }));

const comingSoonView = () =>
  import("@/views/system/ComingSoonView").then((module) => ({
    Component: module.ComingSoonView,
  }));
// #endregion

// #region Guards
/**
 * A settings page behind the permission settingsNav gives it, so the menu and
 * the guard always agree on who may open it. A page that isn't in the menu
 * (one member's page, say) names the permission it needs.
 */
function settingsPage(
  path: RoutePath,
  lazy: RouteObject["lazy"],
  options: { children?: RouteObject[]; requires?: PermissionKey } = {},
): RouteObject {
  const required =
    options.requires ?? settingsNav.find((item) => item.to === path)?.requires;
  return {
    element: (
      <RequirePermission
        anyOf={required ? [required] : []}
        fallback={<ForbiddenView />}
      />
    ),
    children: [{ path, lazy, children: options.children }],
  };
}
// #endregion

export const router = createBrowserRouter([
  {
    // Every page but setup needs a workspace; with none yet, visitors go to setup.
    element: <RequireWorkspace />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <AppLoading />,
    children: [
      {
        // Signed-in pages: only an active member gets past RequireSignedIn.
        element: <RequireSignedIn />,
        errorElement: <RouteError />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: RoutePaths.calendar, lazy: comingSoonView },
              { path: RoutePaths.myTasks, lazy: comingSoonView },
              { path: RoutePaths.workflows, lazy: workflowsView },
              { path: RoutePaths.workflow, lazy: workflowEditView },
              { path: RoutePaths.account, lazy: comingSoonView },
              {
                path: RoutePaths.settings,
                element: (
                  <RequirePermission
                    anyOf={ManagePermissions}
                    fallback={<ForbiddenView />}
                  />
                ),
                children: [
                  {
                    element: <SettingsLayout />,
                    children: [
                      { index: true, element: <SettingsIndexRedirect /> },
                      settingsPage(
                        RoutePaths.settingsGeneral,
                        generalSettingsView,
                      ),
                      settingsPage(RoutePaths.settingsMembers, membersView),
                      settingsPage(RoutePaths.settingsMember, memberView, {
                        requires: "manageMembers",
                      }),
                      settingsPage(RoutePaths.settingsRoles, rolesView, {
                        children: [
                          {
                            path: RoutePaths.settingsRole,
                            children: [
                              {
                                index: true,
                                element: (
                                  <Navigate to={RoleTabs.display} replace />
                                ),
                              },
                              { path: RoleTabs.display, lazy: roleDisplayView },
                              {
                                path: RoleTabs.permissions,
                                lazy: rolePermissionsView,
                              },
                              { path: RoleTabs.members, lazy: roleMembersView },
                            ],
                          },
                        ],
                      }),
                      settingsPage(RoutePaths.settingsGroups, workGroupsView, {
                        // The view reads the id and opens that group itself.
                        children: [{ path: RoutePaths.settingsGroup }],
                      }),
                      settingsPage(RoutePaths.settingsPlatforms, platformsView),
                      settingsPage(RoutePaths.settingsTaskSetup, taskSetupView),
                    ],
                  },
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
    ],
  },
  {
    // First-time setup, open only while there is no workspace (SetupView checks).
    element: <AuthLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <AppLoading />,
    children: [
      {
        path: RoutePaths.setup,
        lazy: setupView,
        handle: { wideContent: true } satisfies AuthLayoutHandle,
      },
    ],
  },
]);
