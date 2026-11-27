// File : /TeamSamsara.Workflow/app/src/features/workflows/model/workflowChecksContent.ts
// Version : 1.1.0
// Latest commit: feature/1.2-order-rules
// Author : Gerrah
// Purpose : What the workflow checks say.

export const WorkflowCheckText = {
  titleRequired: "Give the task a title.",
  tooLong: (characters: number) =>
    `Keep it to ${characters} characters or fewer.`,
  untitled: (index: number) => `Task ${index + 1}`,
} as const;
