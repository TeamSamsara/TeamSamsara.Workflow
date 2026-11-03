// File : /TeamSamsara.Workflow/app/src/shared/components/StepProgress/stepProgressContent.ts
// Version : 1.0.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : The words of the step progress.

export const StepProgressText = {
  step: (current: number, total: number) => `Step ${current} of ${total}`,
} as const;
