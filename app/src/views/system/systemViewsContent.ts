// File : /TeamSamsara.Workflow/app/src/views/system/systemViewsContent.ts
// Version : 1.1.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : The text of the system pages: not found, coming soon, and forbidden.

export const NotFoundViewText = {
  title: "Page not found",
  body: "This address doesn't lead anywhere. It may have changed, or the link was typed wrong.",
  backToCalendar: "Go to the calendar",
} as const;

export const ComingSoonViewText = {
  title: "Coming soon",
  body: "This page is part of a later build step. The menu already knows where it lives.",
} as const;

export const ForbiddenViewText = {
  title: "You can't open this page",
  body: "Your roles don't include the permission this page needs. Ask an admin if you need it.",
  goToMyTasks: "Go to my tasks",
} as const;
