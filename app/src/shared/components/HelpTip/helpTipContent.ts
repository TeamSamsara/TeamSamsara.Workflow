// File : /TeamSamsara.Workflow/app/src/shared/components/HelpTip/helpTipContent.ts
// Version : 1.0.0
// Latest commit: fix/workflow-editor-simpler
// Author : Gerrah
// Purpose : What the help button says to screen readers.

export const HelpTipText = {
  open: (topic: string) => `What is ${topic}?`,
} as const;
