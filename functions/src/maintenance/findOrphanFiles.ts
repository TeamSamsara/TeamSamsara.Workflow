// File : /TeamSamsara.Workflow/functions/src/maintenance/findOrphanFiles.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Storage files nothing uses any more: profile photos under
// members/ and sign-in pictures under signin/ that no member and no sign-in
// slide points at. Files newer than a week are left alone, in case an upload
// is still being saved.

export interface StoredFile {
  /** "members/abc/photo-123.webp" */
  name: string;
  updated: Date;
}

/** The storage path a download address points at, or null for anything else. */
export function pathOfUrl(url: string): string | null {
  const match = /\/o\/([^?]+)/.exec(url);
  return match ? decodeURIComponent(match[1]) : null;
}

export function findOrphanFiles(
  files: readonly StoredFile[],
  referencedUrls: readonly string[],
  now: Date,
  keepDays = 7,
): StoredFile[] {
  const used = new Set(
    referencedUrls.flatMap((url) => {
      const path = pathOfUrl(url);
      return path ? [path] : [];
    }),
  );
  const cutoff = now.getTime() - keepDays * 24 * 60 * 60 * 1000;
  return files.filter(
    (file) =>
      (file.name.startsWith("members/") || file.name.startsWith("signin/")) &&
      !file.name.endsWith("/") &&
      !used.has(file.name) &&
      file.updated.getTime() < cutoff,
  );
}
