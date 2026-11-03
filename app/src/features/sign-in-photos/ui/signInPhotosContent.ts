// File : /TeamSamsara.Workflow/app/src/features/sign-in-photos/ui/signInPhotosContent.ts
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : The words for the sign-in page's pictures: their card in
// Settings › General and the dots on the sign-in page.

export const SignInPhotosText = {
  title: "Sign-in page",
  description:
    "Pictures that take turns behind the welcome on the sign-in page. Anyone with the link can see them, so use team photos or banners, nothing private.",
  empty: "No pictures yet: the sign-in page shows its plain dark panel.",
  add: "Add picture",
  adding: "Adding…",
  full: (count: number) =>
    `That's the most (${count}). Remove one to add another.`,
  help: "JPG, PNG or WebP. Wide pictures work best; they're made smaller before they're saved.",
  picture: (index: number) => `Picture ${index}`,
  earlier: "Move earlier",
  later: "Move later",
  remove: "Remove",
  added: "Picture added",
  removed: "Picture removed",
  failed: "That didn't work",
  adminOnly: "Only Administrators change these.",
  show: (index: number, count: number) => `Show picture ${index} of ${count}`,
  pictures: "Pictures",
} as const;
