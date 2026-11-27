// File : /TeamSamsara.Workflow/app/src/core/data/collections.ts
// Version : 1.12.0
// Latest commit: feature/1.2-after-saving
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
  /** Labels for people (Starter, Coach…), to pick who to compare on Team availability. */
  peopleTags: "peopleTags",
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
  /** Each person's weeks in one word each, kept by the server (workload). */
  memberWeeks: "memberWeeks",
  /** Each group's weeks (how much its tasks take), kept by the server. */
  groupWeeks: "groupWeeks",
  /** One record per set or repeat planned, so the server sends one summary per person. */
  bulkPlans: "bulkPlans",
  /** One record each time a workflow's changes were passed on to its upcoming tasks. */
  workflowSyncs: "workflowSyncs",
  /** After a workflow save: its tasks whose due time differs, for whoever saved it. */
  workflowReviews: "workflowReviews",
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
