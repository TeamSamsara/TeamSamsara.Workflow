// File : /TeamSamsara.Workflow/app/src/app/layouts/AppLayout/appLayoutContent.ts
// Version : 1.1.0
// Latest commit: feature/1.2-view-as-role
// Author : Gerrah
// Purpose : The text of the app layout: the skip link, the phone menu button
// and the viewing-as bar.

export const AppLayoutText = {
  skipToContent: "Skip to content",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  viewingAs: (role: string) => `Viewing as ${role}.`,
  viewingNote:
    "You see what people with only this role see. Nothing you do here is done as them.",
  stopViewing: "Stop viewing",
} as const;
