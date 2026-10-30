// File : /TeamSamsara.Workflow/app/src/views/workflows/workflowsViewContent.ts
// Version : 1.2.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : The words on the Workflows page.

export const WorkflowsViewText = {
  title: "Workflows",
  description:
    "Reusable lists of tasks. Use one on an event and its tasks appear with their due times worked out.",
  howItWorks: "How it works",
  import: "Import",
  importLabel: "Import a workflow file",
  new: "New workflow",
  newGuided: "With the guide",
  newGuidedDetail: "One question at a time. Best for your first one.",
  newBlank: "Blank",
  newBlankDetail: "Straight to the editor.",
  filterLabel: "Show",
  filters: { active: "In use", archived: "Archived" },
  filterWithCount: (label: string, count: number) => `${label} (${count})`,
  loading: "Loading workflows",
  readOnly: "Only members with Edit workflows can change workflows.",
  importFailed: "That file couldn't be imported",
  firstTitle: "No workflows yet",
  firstBody:
    "A workflow is the list of tasks that happen around one kind of event. The guide walks you through making your first one in a couple of minutes.",
  firstAction: "Create your first workflow",
} as const;
