// File : /TeamSamsara.Workflow/app/src/features/platforms/ui/describeLimits.ts
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : A platform's limits in one line, for the platforms table and,
// later, the post editor.

import { postKinds } from "../catalogue/platformCatalogue";
import type { Platform, PostKind } from "../catalogue/platformTypes";
import { PlatformFieldText, PlatformLimitText } from "./platformsContent";

/** "Post 280 characters · up to 4 images · 1 video" for one kind of post. */
function describeKind(kind: PostKind): string {
  const parts = kind.texts.map((limit) =>
    PlatformLimitText.characters(
      PlatformFieldText[limit.field],
      limit.maxCharacters,
    ),
  );
  const { maxImages, maxVideos, maxHashtags } = kind.media;
  if (maxHashtags) parts.push(PlatformLimitText.hashtags(maxHashtags));
  if (maxImages) parts.push(PlatformLimitText.images(maxImages));
  if (maxVideos) parts.push(PlatformLimitText.videos(maxVideos));
  return parts.join(PlatformLimitText.separator);
}

/** Every kind of post the workspace can make on the platform, in one line. */
export function describeLimits(platform: Platform, hasPremium = false): string {
  return postKinds(platform, hasPremium)
    .map(describeKind)
    .join(PlatformLimitText.separator);
}
