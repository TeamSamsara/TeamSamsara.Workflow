// File : /TeamSamsara.Workflow/app/src/features/workflows/model/workflowChecksContent.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : What the workflow checks say.

export const WorkflowCheckText = {
  titleRequired: "Give the task a title.",
  tooLong: (characters: number) =>
    `Keep it to ${characters} characters or fewer.`,
} as const;
