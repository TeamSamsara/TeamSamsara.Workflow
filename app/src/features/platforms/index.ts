// File : /TeamSamsara.Workflow/app/src/features/platforms/index.ts
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : What other layers may use from the platforms feature.

export {
  findPlatform,
  PlatformCatalogue,
  PlatformIds,
  PremiumPlatformIds,
  postKinds,
} from "./catalogue/platformCatalogue";
export type {
  MediaLimits,
  Platform,
  PlatformSetting,
  PlatformTextField,
  PostKind,
  PremiumTier,
  TextLimit,
} from "./catalogue/platformTypes";
export {
  checkText,
  countCharacters,
  countHashtags,
} from "./catalogue/textLimits";
export type { TextCheck } from "./catalogue/textLimits";
export { usePlatforms } from "./hooks/usePlatforms";
export type { PlatformList } from "./hooks/usePlatforms";
export { PlatformMark } from "./ui/PlatformMark";
export { describeLimits } from "./ui/describeLimits";
export { PlatformsTable } from "./ui/PlatformsTable";
export { PlatformFieldText } from "./ui/platformsContent";
