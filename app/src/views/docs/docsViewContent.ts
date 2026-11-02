// File : /TeamSamsara.Workflow/app/src/views/docs/docsViewContent.ts
// Version : 1.1.0
// Latest commit: chore/rename-playbook
// Author : Gerrah
// Purpose : The words on the Documentation page.

export const DocsViewText = {
  title: "Documentation",
  description:
    "How every part of Playbook works. You see the articles for what your roles let you do.",
  viewAs: "View as",
  me: "Me",
  viewAsNote: (role: string) =>
    `Showing what someone with only the ${role} role sees.`,
  replay: "Replay the walkthrough",
  search: "Search the documentation",
  searchPlaceholder: "Search: availability, approve, repeat, roles…",
  articles: "Articles",
  noResults: "Nothing matches that. Try other words.",
  everyone: "Everyone",
  shownTo: (who: string) => `For: ${who}`,
  shownToAll: "Shown to everyone",
  showMe: "Show me in the app",
  next: (title: string) => `Next: ${title}`,
  notFound: "That article doesn't exist, or isn't for your roles.",
} as const;
