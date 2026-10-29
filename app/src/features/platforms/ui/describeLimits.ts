// File : /TeamSamsara.Workflow/app/src/features/platforms/ui/describeLimits.ts
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : A platform's limits in one line, for the platforms table and,
// later, the post editor.

import type { EffectiveLimits, TextLimit } from "../catalogue/platformTypes";
import { PlatformFieldText, PlatformLimitText } from "./platformsContent";

function describeTexts(texts: readonly TextLimit[]): string[] {
  return texts.map((limit) =>
    PlatformLimitText.characters(
      PlatformFieldText[limit.field],
      limit.maxCharacters,
    ),
  );
}

/** "Post 280 characters · up to 4 images · 1 video", plus any extra kinds of post. */
export function describeLimits(limits: EffectiveLimits): string {
  const parts = describeTexts(limits.texts);
  const { maxImages, maxVideos, maxHashtags } = limits.media;
  if (maxHashtags) parts.push(PlatformLimitText.hashtags(maxHashtags));
  if (maxImages) parts.push(PlatformLimitText.images(maxImages));
  if (maxVideos) parts.push(PlatformLimitText.videos(maxVideos));
  // "Articles 100,000 characters": the kind of post stands in for the field name.
  for (const format of limits.formats) {
    for (const limit of format.texts) {
      parts.push(
        PlatformLimitText.characters(
          PlatformLimitText.plural(format.name),
          limit.maxCharacters,
        ),
      );
    }
  }
  return parts.join(PlatformLimitText.separator);
}
