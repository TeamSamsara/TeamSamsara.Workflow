// File : /TeamSamsara.Workflow/app/src/views/workflows/workflowsViewContent.ts
// Version : 1.1.0
// Latest commit: fix/workflow-editor-simpler
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
  intro: {
    title: "How workflows work",
    steps: [
      {
        title: "List what an event needs",
        text: "A workflow is the tasks that happen around one kind of event: the thumbnail, the posts, saving the VOD.",
      },
      {
        title: "Say who and when",
        text: 'Give each task to a work group or a person, and pick when it\'s due, like "The day before".',
      },
      {
        title: "Use it on an event",
        text: "When you plan an event, pick the workflow. Everyone gets their tasks, with real dates.",
      },
    ],
  },
} as const;
