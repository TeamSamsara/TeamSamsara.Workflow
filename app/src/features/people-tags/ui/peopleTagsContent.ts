// File : /TeamSamsara.Workflow/app/src/features/people-tags/ui/peopleTagsContent.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The words of people tags: the settings card and the tag pills.

export const PeopleTagsText = {
  title: "People tags",
  description:
    "Labels for people, like Starter, Sub, Coach or Manager, or Lead editor for the video team. Use them to pick who to compare on Team availability. They don't give anyone permissions.",
  add: "Add tag",
  empty: "No people tags yet. Add the ones your team uses.",
  count: (people: number) =>
    people === 0
      ? "No one yet"
      : people === 1
        ? "1 person"
        : `${people} people`,
  tagsTitle: "Tags",
  noTags: "No tags",
  noTagsYet: "No people tags yet. Make them in Settings › Members.",
  toggle: (tag: string, name: string) => `${tag} for ${name}`,
  saveFailed: "Couldn't save the tags",
} as const;
