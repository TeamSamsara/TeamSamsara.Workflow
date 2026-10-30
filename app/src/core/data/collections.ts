// File : /TeamSamsara.Workflow/app/src/core/data/collections.ts
// Version : 1.2.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : The name of every Firestore collection and settings document, in one
// place. One Firebase project holds one workspace, so everything sits at the top.

export const Collections = {
  /** One document per member, keyed by their sign-in account id. */
  members: "members",
  workGroups: "workGroups",
  /** The steps a task moves through. */
  statuses: "statuses",
  /** What goes on the calendar (Livestream, Meeting…), each with a colour. */
  eventTypes: "eventTypes",
  /** Labels a workspace makes for its tasks, like Trello's. */
  tags: "tags",
  workflows: "workflows",
  events: "events",
  repeats: "repeats",
  tasks: "tasks",
  /** Workspace-wide documents that exist once (see ConfigDocuments). */
  config: "config",
} as const;

/** The single documents inside the config collection. */
export const ConfigDocuments = {
  /** Name, time zone, formats, default theme, switched-on platforms. */
  workspace: "workspace",
  /** Every role and the permission index the security rules read. */
  roles: "roles",
} as const;

export type CollectionName = (typeof Collections)[keyof typeof Collections];
export type ConfigDocumentName =
  (typeof ConfigDocuments)[keyof typeof ConfigDocuments];
