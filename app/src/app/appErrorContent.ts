// File : /TeamSamsara.Workflow/app/src/app/appErrorContent.ts
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The text of the two error screens: the whole app crashing, and one
// page failing to load.

export const AppErrorFallbackText = {
  title: "Something went wrong",
  body: "Workflow hit an error it couldn't recover from. Reloading usually fixes it; nothing you saved is lost.",
  reload: "Reload the page",
} as const;

export const RouteErrorText = {
  title: "This page didn't load",
  body: "Something went wrong while opening this page. Try again, or go back to the calendar.",
  tryAgain: "Try again",
  backToCalendar: "Go to the calendar",
} as const;
