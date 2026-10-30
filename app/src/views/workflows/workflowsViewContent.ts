// File : /TeamSamsara.Workflow/app/src/views/workflows/workflowsViewContent.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : The words on the Workflows page.

export const WorkflowsViewText = {
  title: "Workflows",
  description:
    "Reusable lists of tasks. Use one on an event and its tasks appear with their due times worked out.",
  import: "Import",
  importLabel: "Import a workflow file",
  new: "New workflow",
  filterLabel: "Show",
  filters: { active: "In use", archived: "Archived" },
  filterWithCount: (label: string, count: number) => `${label} (${count})`,
  loading: "Loading workflows",
  readOnly: "Only members with Edit workflows can change workflows.",
  importFailed: "That file couldn't be imported",
} as const;
