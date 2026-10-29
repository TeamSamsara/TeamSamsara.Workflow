// File : /TeamSamsara.Workflow/app/src/views/system/systemViewsContent.ts
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The text of the system pages: not found, and coming soon.

export const NotFoundViewText = {
  title: "Page not found",
  body: "This address doesn't lead anywhere. It may have changed, or the link was typed wrong.",
  backToCalendar: "Go to the calendar",
} as const;

export const ComingSoonViewText = {
  title: "Coming soon",
  body: "This page is part of a later build step. The menu already knows where it lives.",
} as const;
