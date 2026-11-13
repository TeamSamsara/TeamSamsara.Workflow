// File : /TeamSamsara.Workflow/app/src/features/work-groups/service/groupRules.ts
// Version : 1.1.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : The checks behind a work group's links: whether a link is a web
// address. Anyone can lead a group; leading is what lets them approve and
// hand out its tasks.

import { GroupRulesText } from "../ui/workGroupsContent";

const webAddress = /^https?:\/\/[^\s/$.?#][^\s]*$/i;

/** The problem with a link, or undefined when it's fine. */
export function checkLink(link: {
  label: string;
  url: string;
}): string | undefined {
  const url = link.url.trim();
  if (!url) return GroupRulesText.urlRequired;
  if (!webAddress.test(url)) return GroupRulesText.urlInvalid;
  if (!link.label.trim()) return GroupRulesText.labelRequired;
  return undefined;
}
