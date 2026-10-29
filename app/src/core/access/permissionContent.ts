// File : /TeamSamsara.Workflow/app/src/core/access/permissionContent.ts
// Version : 1.0.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : The name and one-line description of every permission and group, as
// the Roles page and member pages show them.

import type { PermissionGroup } from "./permissionCatalogue";
import type { PermissionKey } from "./permissionKeys";

export const PermissionGroupText: Record<PermissionGroup, string> = {
  general: "General",
  workspace: "Workspace",
  planning: "Planning",
  tasks: "Tasks",
  viewing: "Viewing",
};

export const PermissionText: Record<
  PermissionKey,
  { label: string; description: string }
> = {
  administrator: {
    label: "Administrator",
    description:
      "Every permission, and skips every check. Give it to very few people.",
  },
  manageSettings: {
    label: "Manage settings",
    description:
      "Change the workspace name, time zone, platforms, task kinds, statuses and event types.",
  },
  manageMembers: {
    label: "Manage members",
    description: "Invite people, turn off access, remove members.",
  },
  manageRoles: {
    label: "Manage roles",
    description: "Create and edit roles below their own highest role.",
  },
  manageWorkGroups: {
    label: "Manage work groups",
    description: "Create groups and change who is in them.",
  },
  editWorkflows: {
    label: "Edit workflows",
    description: "Create, change and archive workflows.",
  },
  planEvents: {
    label: "Plan events and repeats",
    description: "Add events to the calendar, apply workflows, set repeats.",
  },
  createStandaloneTasks: {
    label: "Create standalone tasks",
    description: "Add one-off tasks that aren't part of an event.",
  },
  doAssignedTasks: {
    label: "Do assigned tasks",
    description: "Tick off tasks given to them or their work groups.",
  },
  editAnyTask: {
    label: "Edit any task",
    description: "Change any task's details, due time or checklist.",
  },
  approveTasks: {
    label: "Approve tasks",
    description: "Sign off tasks that need approval.",
  },
  reassignTasks: {
    label: "Reassign tasks",
    description: "Give a task to another person or work group.",
  },
  viewAll: {
    label: "View all events and tasks",
    description:
      "Without it, people only see what is given to them or their work groups.",
  },
};
