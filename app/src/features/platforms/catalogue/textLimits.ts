// File : /TeamSamsara.Workflow/app/src/features/platforms/catalogue/textLimits.ts
// Version : 1.0.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : Counts the characters in a post the way people see them (an emoji
// or an accented letter is one, a line break is one) and checks a text
// against a platform's limit. Platforms count slightly differently (X counts
// links as 23, for example); this is the honest everyday count.

import type { TextLimit } from "./platformTypes";

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** How many characters a person would count. */
export function countCharacters(text: string): number {
  return Array.from(segmenter.segment(text)).length;
}

export interface TextCheck {
  count: number;
  max: number;
  /** Characters left; negative when over. */
  remaining: number;
  isOver: boolean;
}

export function checkText(text: string, limit: TextLimit): TextCheck {
  const count = countCharacters(text);
  const remaining = limit.maxCharacters - count;
  return { count, max: limit.maxCharacters, remaining, isOver: remaining < 0 };
}

/** Hashtags in a text ("#word"), for platforms that cap them. */
export function countHashtags(text: string): number {
  return text.match(/(^|\s)#[\p{L}\p{N}_]+/gu)?.length ?? 0;
}
