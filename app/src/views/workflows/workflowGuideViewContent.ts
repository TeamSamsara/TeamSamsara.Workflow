// File : /TeamSamsara.Workflow/app/src/views/workflows/workflowGuideViewContent.ts
// Version : 1.0.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : The words around the guided setup page.

export const WorkflowGuideViewText = {
  workflows: "Workflows",
  title: "New workflow",
  created: (name: string) => `${name} created`,
  discard: {
    title: "Leave the guide?",
    body: "What you've filled in so far won't be kept.",
    keep: "Keep going",
    confirm: "Leave",
  },
} as const;
