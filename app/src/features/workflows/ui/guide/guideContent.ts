// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/guide/guideContent.ts
// Version : 1.0.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : The words of the guided workflow setup, one block per step.

export const GuideText = {
  steps: {
    name: {
      label: "Name it",
      title: "What kind of event is this for?",
      body: "Name the workflow after the event it's for. You'll pick it by this name when you plan one.",
      name: "Workflow name",
      namePlaceholder: "Livestream",
      suggestions: "Or pick one",
      description: "What it's for (optional)",
      descriptionPlaceholder: "Before, during and after a stream.",
    },
    tasks: {
      label: "List the tasks",
      title: "What needs doing every time?",
      body: "Add each task in a few words. Think of everything before, during and after the event.",
      input: "New task",
      inputPlaceholder: "Thumbnail",
      add: "Add",
      suggestions: "Common tasks",
      remove: (title: string) => `Remove ${title}`,
      count: (count: number) => (count === 1 ? "1 task" : `${count} tasks`),
      none: "No tasks yet. Type one above or pick a common one.",
    },
    who: {
      label: "Who does each",
      title: "Who does each task?",
      body: "Give a task to a work group and anyone in it can take it, or give it to one person. Not sure yet? Leave it and decide later.",
    },
    when: {
      label: "When it's due",
      title: "When is each task due?",
      body: 'Due times are counted from when the event starts. If a stream starts Saturday at 7:00 PM, "The day before" means Friday at 7:00 PM.',
    },
    review: {
      label: "Check and create",
      title: "Does this look right?",
      body: "Tasks are listed in the order they're due. After you create it you can open any task to add post text, a checklist, links or approval.",
      unassigned: "No one yet",
    },
  },
  cancel: "Cancel",
  back: "Back",
  next: "Continue",
  create: "Create workflow",
  needName: "Give the workflow a name to continue.",
  needTask: "Add at least one task to continue.",
  full: (max: number) => `A workflow holds up to ${max} tasks.`,
  createFailed: "The workflow couldn't be created",
} as const;
