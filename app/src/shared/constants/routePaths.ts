// File : /TeamSamsara.Workflow/app/src/shared/constants/routePaths.ts
// Version : 1.2.0
// Latest commit: core/workspace
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
