// File : /TeamSamsara.Workflow/releases/types.ts
// Version : 1.0.0
// Latest commit: feature/whats-new
// Author : Gerrah
// Purpose : What a release note holds (see README.md): its version and date,
// a summary for the announcement, and its changes, each new, improved or
// fixed, for everyone or for Administrators only.

export const ChangeKinds = ["new", "improved", "fixed"] as const;
export type ChangeKind = (typeof ChangeKinds)[number];

export interface ReleaseChange {
  kind: ChangeKind;
  title: string;
  body: string;
  /** Shown in the What's new panel, one at a time. */
  highlight?: boolean;
  /** Who sees it; everyone unless it says "admins". */
  audience?: "everyone" | "admins";
  /** The help article that explains it. */
  article?: string;
  /** The name of a picture drawn for it in the app. */
  picture?: string;
}

export interface Release {
  /** "1.2.0". */
  version: string;
  /** "2026-11-12": the day it goes live. */
  date: string;
  /** One or two sentences, for the notification and the email. */
  summary: string;
  changes: ReleaseChange[];
}
