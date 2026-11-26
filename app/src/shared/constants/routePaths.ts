// File : /TeamSamsara.Workflow/app/src/shared/constants/routePaths.ts
// Version : 1.17.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Every address in the app, in one place, so links and routes can
// never disagree about where a page lives.

export const RoutePaths = {
  // #region Main menu
  calendar: "/",
  myTasks: "/my-tasks",
  /** Planning an event; ?date=2026-11-09 starts it on that day. */
  newEvent: "/events/new",
  /** Planning several events at once, as a set; ?set=<id> adds to one. */
  planSeveral: "/events/new/several",
  /** Every set of events. */
  eventSets: "/events/sets",
  /** One set's page. */
  eventSet: "/events/sets/:setId",
  /** One event's page. */
  event: "/events/:eventId",
  /** One task's page. */
  task: "/tasks/:taskId",
  workflows: "/workflows",
  /** Making a workflow one question at a time. */
  workflowGuide: "/workflows/guide",
  /** One workflow in the editor; "new" for a workflow not saved yet. */
  workflow: "/workflows/:workflowId",
  account: "/account",
  /** The notification list on its own page (the bell opens it on a phone). */
  notifications: "/notifications",
  /** How everything works, for what you can do. */
  docs: "/docs",
  /** One article. */
  docsArticle: "/docs/:articleId",
  availability: "/availability",
  availabilityTeam: "/availability/team",
  /** Every work group, as cards. */
  groups: "/groups",
  /** One group's overview. */
  group: "/groups/:groupId",
  /** Someone's read-only profile. */
  person: "/people/:memberId",
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
  settingsFields: "/settings/fields",
  settingsActivity: "/settings/activity",
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

/** /groups/:groupId, the group's overview. */
export function groupPath(groupId: string): string {
  return `/groups/${encodeURIComponent(groupId)}`;
}

/** /people/:memberId, someone's read-only profile. */
export function personPath(memberId: string): string {
  return `/people/${encodeURIComponent(memberId)}`;
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

/** /tasks/:taskId */
export function taskPath(taskId: string): string {
  return `/tasks/${encodeURIComponent(taskId)}`;
}

/** /events/:eventId */
export function eventPath(eventId: string): string {
  return `/events/${encodeURIComponent(eventId)}`;
}

/** /events/new, starting on a day when one is given ("2026-11-09"). */
export function newEventPath(date?: string): string {
  return date ? `/events/new?date=${encodeURIComponent(date)}` : "/events/new";
}

/** /events/sets/:setId */
export function eventSetPath(setId: string): string {
  return `/events/sets/${encodeURIComponent(setId)}`;
}

/** /events/new/several, adding to a set when one is given. */
export function planSeveralPath(setId?: string): string {
  return setId
    ? `/events/new/several?set=${encodeURIComponent(setId)}`
    : "/events/new/several";
}

/** /docs/:articleId */
export function docsPath(articleId?: string): string {
  return articleId ? `/docs/${encodeURIComponent(articleId)}` : "/docs";
}
