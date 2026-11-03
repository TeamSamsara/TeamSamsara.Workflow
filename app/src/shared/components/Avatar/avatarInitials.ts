// File : /TeamSamsara.Workflow/app/src/shared/components/Avatar/avatarInitials.ts
// Version : 1.0.0
// Latest commit: core/ui-kit
// Author : Gerrah
// Purpose : Works out the two letters an avatar shows when there is no photo: the first
// letters of the first and last words of a name ("Sam Rivera" becomes "SR").

const maxInitials = 2;

export function avatarInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  const first = words[0];
  const last = words.length > 1 ? words[words.length - 1] : "";
  const letters = last
    ? `${first.charAt(0)}${last.charAt(0)}`
    : first.slice(0, maxInitials);

  return letters.toLocaleUpperCase();
}
