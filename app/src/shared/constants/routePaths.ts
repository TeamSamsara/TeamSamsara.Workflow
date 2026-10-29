// File : /TeamSamsara.Workflow/app/src/shared/constants/routePaths.ts
// Version : 1.3.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : Every address in the app, in one place, so links and routes can
// never disagree about where a page lives.

export const RoutePaths = {
  // #region Main menu
  calendar: "/",
  myTasks: "/my-tasks",
  workflows: "/workflows",
  account: "/account",
  // #endregion

  // #region Settings
  settings: "/settings",
  settingsGeneral: "/settings/general",
  settingsMembers: "/settings/members",
  settingsRoles: "/settings/roles",
  /** One role; opens its Display tab (Permissions for Everyone). */
  settingsRole: "/settings/roles/:roleId",
  settingsGroups: "/settings/groups",
  settingsPlatforms: "/settings/platforms",
  settingsTaskSetup: "/settings/tasks-and-events",
  // #endregion

  // #region Sign-in
  signIn: "/sign-in",
  forgotPassword: "/forgot-password",
  checkInbox: "/check-your-inbox",
  /** Where every Firebase email link lands (set as the action URL in the console). */
  emailLink: "/auth/link",
  linkExpired: "/link-expired",
  noAccess: "/no-access",
  // #endregion

  /** First-time setup; opens only while there is no workspace. */
  setup: "/setup",

  /** Matches any address no other route claims. */
  notFound: "*",
} as const;

export type RoutePath = (typeof RoutePaths)[keyof typeof RoutePaths];

/** The tabs of a role, as the last part of its address. */
export const RoleTabs = {
  display: "display",
  permissions: "permissions",
} as const;
export type RoleTab = (typeof RoleTabs)[keyof typeof RoleTabs];

/** /settings/roles/:roleId, or one of its tabs. */
export function rolePath(roleId: string, tab?: RoleTab): string {
  const base = `${RoutePaths.settingsRoles}/${encodeURIComponent(roleId)}`;
  return tab ? `${base}/${tab}` : base;
}
