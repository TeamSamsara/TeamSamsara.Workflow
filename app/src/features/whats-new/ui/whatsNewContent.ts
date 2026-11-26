// File : /TeamSamsara.Workflow/app/src/features/whats-new/ui/whatsNewContent.ts
// Version : 1.0.0
// Latest commit: feature/whats-new
// Author : Gerrah
// Purpose : The words around the release notes: the panel, the page and the
// change kinds. The notes themselves are in /releases.

import type { ChangeKind } from "@releases/index";
import { formatDate, type DateFormat } from "@/shared/time/dates";

/** "1.2.0" → "1.2"; "1.2.1" stays as it is. */
export const shortVersion = (version: string) => version.replace(/\.0$/, "");

/** Release dates are calendar days ("2026-11-12"), the same everywhere. */
export const releaseDay = (date: string, format: DateFormat) =>
  formatDate(new Date(`${date}T12:00:00Z`), "UTC", format);

export const WhatsNewText = {
  panelTitle: (version: string) =>
    `What's new in Playbook ${shortVersion(version)}`,
  released: (date: string) => `Released ${date}`,
  position: (at: number, of: number) => `${at} of ${of}`,
  show: (at: number, of: number) => `Show ${at} of ${of}`,
  everything: (version: string) => `Everything in ${shortVersion(version)}`,
  howItWorks: "How it works",
  back: "Back",
  next: "Next",
  gotIt: "Got it",
  pageTitle: "What's new",
  pageDescription: "Every version of Playbook and what changed in it.",
  latest: "Latest",
  version: (version: string) => `Playbook ${shortVersion(version)}`,
  releases: "Releases",
  filterLabel: "Show",
  all: "All",
  none: "No release notes yet.",
  nothingOfKind: "Nothing of this kind in this release.",
  admins: "Admins",
  kinds: {
    new: "New",
    improved: "Improved",
    fixed: "Fixed",
  } satisfies Record<ChangeKind, string>,
} as const;
