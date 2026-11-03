// File : /TeamSamsara.Workflow/app/src/views/workflows/workflowEditViewContent.ts
// Version : 1.1.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : The words on the workflow editor page.

export const WorkflowEditViewText = {
  workflows: "Workflows",
  newTitle: "New workflow",
  untitled: "Untitled workflow",
  loading: "Loading workflow",
  notFound: "That workflow doesn't exist any more.",
  backToList: "Back to workflows",
  export: "Export",
  archive: "Archive",
  restore: "Restore",
  delete: "Delete",
  reset: "Reset",
  save: "Save",
  create: "Create workflow",
  saved: (name: string) => `${name} saved`,
  created: (name: string) => `${name} created`,
  archived: (name: string) => `${name} archived`,
  restored: (name: string) => `${name} restored`,
  deleted: (name: string) => `${name} deleted`,
  actionFailed: "That didn't work",
  readOnly: "Only members with Edit workflows can change this workflow.",
  archivedNote:
    "This workflow is archived: it isn't offered when planning events. Restore it to use it again.",
  problems: (count: number) =>
    count === 1
      ? "1 thing needs fixing before saving."
      : `${count} things need fixing before saving.`,
  imported: (dropped: number) =>
    dropped === 0
      ? "Imported. Check it over, then create it."
      : `Imported. ${dropped} ${dropped === 1 ? "thing that points" : "things that point"} at groups, people, tags, event types or platforms this workspace doesn't have ${dropped === 1 ? "was" : "were"} left out.`,
  exportFirst: "Save your changes to export them.",
  nextSteps: {
    title: "Your workflow is ready.",
    body: "Open any task to add what to post, a checklist, links, or to ask for approval. Save when you're done.",
    dismiss: "Got it",
  },
  discard: {
    title: "Discard your changes?",
    body: "This workflow has changes you haven't saved. Leaving now throws them away.",
    keep: "Keep editing",
    confirm: "Discard changes",
  },
  confirmDelete: {
    title: (name: string) => `Delete ${name}?`,
    body: "Tasks already made from it stay as they are. This can't be undone.",
    cancel: "Cancel",
    confirm: "Delete workflow",
  },
} as const;
