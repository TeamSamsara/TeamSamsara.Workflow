// File : /TeamSamsara.Workflow/app/src/features/members/service/emailList.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Turns typed or pasted text into a list of emails: split on commas,
// semicolons, spaces and new lines, lower-cased, without repeats. Anything that
// isn't an email is handed back so the field can keep it for fixing.

import { isEmailAddress } from "@/shared/validation/emailFormat";

const separators = /[\s,;]+/;

export interface EmailListChange {
  /** The list with the new emails added at the end. */
  emails: string[];
  /** What wasn't an email, as typed. */
  rejected: string[];
}

export function splitEmails(text: string): string[] {
  return text
    .split(separators)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function addEmails(
  current: readonly string[],
  text: string,
): EmailListChange {
  const emails = [...current];
  const rejected: string[] = [];
  for (const part of splitEmails(text)) {
    if (!isEmailAddress(part)) {
      rejected.push(part);
      continue;
    }
    const email = part.toLowerCase();
    if (!emails.includes(email)) emails.push(email);
  }
  return { emails, rejected };
}
