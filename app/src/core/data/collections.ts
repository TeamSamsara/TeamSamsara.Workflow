// File : /TeamSamsara.Workflow/app/src/core/data/collections.ts
// Version : 1.9.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The name of every Firestore collection and settings document, in one
// place. One Firebase project holds one workspace, so everything sits at the top.

export const Collections = {
  /** One document per member, keyed by their sign-in account id. */
  members: "members",
  workGroups: "workGroups",
  /** The steps a task moves through. */
  statuses: "statuses",
  /** What goes on the calendar (Match, Content drop, Meeting…), each with a colour. */
  eventTypes: "eventTypes",
  /** Labels a workspace makes for its tasks, like Trello's. */
  tags: "tags",
  workflows: "workflows",
  /** The details an event can have (Opponent, League…), keyed by how text writes them. */
  fields: "fields",
  events: "events",
  repeats: "repeats",
  eventSets: "eventSets",
  availability: "availability",
  personal: "personal",
  busy: "busy",
  tasks: "tasks",
  /** One record each time a workflow's changes were passed on to its upcoming tasks. */
  workflowSyncs: "workflowSyncs",
  /** What the server functions tell each member; they read and clear their own. */
  notifications: "notifications",
  /** Each member's choice of what they're told about, and where. */
  notificationSettings: "notificationSettings",
  /** Workspace-wide documents that exist once (see ConfigDocuments). */
  config: "config",
} as const;

/** The single documents inside the config collection. */
export const ConfigDocuments = {
  /** Name, time zone, formats, default theme, switched-on platforms. */
  workspace: "workspace",
  /** Every role and the permission index the security rules read. */
  roles: "roles",
  /** The sign-in page's pictures; readable before sign-in. */
  signin: "signin",
} as const;

export type CollectionName = (typeof Collections)[keyof typeof Collections];
export type ConfigDocumentName =
  (typeof ConfigDocuments)[keyof typeof ConfigDocuments];
