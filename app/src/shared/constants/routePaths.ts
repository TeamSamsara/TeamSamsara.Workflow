// File : /TeamSamsara.Workflow/app/src/shared/constants/routePaths.ts
// Version : 1.6.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : Every address in the app, in one place, so links and routes can
// never disagree about where a page lives.

export const RoutePaths = {
  // #region Main menu
  calendar: "/",
  myTasks: "/my-tasks",
  workflows: "/workflows",
  /** One workflow in the editor; "new" for a workflow not saved yet. */
  workflow: "/workflows/:workflowId",
  account: "/account",
  // #endregion

  // #region Settings
  settings: "/settings",
  settingsGeneral: "/settings/general",
  settingsMembers: "/settings/members",
  /** One member's page. */
  settingsMember: "/settings/members/:memberId",
  settingsRoles: "/settings/roles",
  /** One role; opens its Display tab (Permissions for Everyone). */
  settingsRole: "/settings/roles/:roleId",
  settingsGroups: "/settings/groups",
  /** One work group, open in the editor under the cards. */
  settingsGroup: "/settings/groups/:groupId",
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
  members: "members",
} as const;
export type RoleTab = (typeof RoleTabs)[keyof typeof RoleTabs];

/** /settings/roles/:roleId, or one of its tabs. */
export function rolePath(roleId: string, tab?: RoleTab): string {
  const base = `${RoutePaths.settingsRoles}/${encodeURIComponent(roleId)}`;
  return tab ? `${base}/${tab}` : base;
}

/** /settings/groups/:groupId */
export function workGroupPath(groupId: string): string {
  return `${RoutePaths.settingsGroups}/${encodeURIComponent(groupId)}`;
}

/** /settings/members/:memberId */
export function memberPath(memberId: string): string {
  return `${RoutePaths.settingsMembers}/${encodeURIComponent(memberId)}`;
}

/** The id in a workflow's address while it hasn't been saved yet. */
export const NewWorkflowId = "new";

/** /workflows/:workflowId, or the editor for a new workflow. */
export function workflowPath(workflowId: string = NewWorkflowId): string {
  return `${RoutePaths.workflows}/${encodeURIComponent(workflowId)}`;
}
