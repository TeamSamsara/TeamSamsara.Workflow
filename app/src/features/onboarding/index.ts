// File : /TeamSamsara.Workflow/app/src/features/onboarding/index.ts
// Version : 1.1.0
// Latest commit: feature/docs-refresh
// Author : Gerrah
// Purpose : What other layers may use from the onboarding feature.

export { DocGroups, docsFor, searchDocs } from "./docs/articles";
export type { Article, Block, DocGroup } from "./docs/articles";
export { useWalkthrough } from "./hooks/useWalkthrough";
export type { WalkthroughApi } from "./hooks/WalkthroughContext";
export {
  Chapters,
  chaptersFor,
  chaptersLeft,
  totalMinutes,
} from "./model/chapters";
export type { Chapter, ChapterId, TourTargetId } from "./model/chapters";
export { OnboardingPreview } from "./ui/OnboardingPreview";
export { TourTarget } from "./ui/TourTarget";
export { WalkthroughCard } from "./ui/WalkthroughCard";
export { WalkthroughProvider } from "./ui/WalkthroughProvider";
export { DocPicture } from "./docs/ui/DocPicture";
