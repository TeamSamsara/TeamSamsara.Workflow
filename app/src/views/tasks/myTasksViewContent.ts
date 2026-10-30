// File : /TeamSamsara.Workflow/app/src/views/tasks/myTasksViewContent.ts
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : The words on My tasks.

export const MyTasksViewText = {
  title: "My tasks",
  description: (groups: string[]) =>
    groups.length > 0
      ? `Tasks given to you and to your work groups: ${groups.join(", ")}.`
      : "Tasks given to you.",
  scopeLabel: "Show",
  scopes: { all: "Mine and my groups", mine: "Only mine" },
  newTask: "New task",
  created: (title: string) => `${title} created`,
  loading: "Loading your tasks",
  emptyTitle: "Nothing to do",
  emptyBody:
    "Tasks given to you or your work groups show up here, grouped by when they're due.",
  approvals: "Waiting for your approval",
  approvalsNote: "Shows because you have the Approve tasks permission.",
  noApprovals: "Nothing waiting for approval.",
} as const;
