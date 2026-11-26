// File : /TeamSamsara.Workflow/app/src/features/whats-new/ui/ReleasePicture.tsx
// Version : 1.0.0
// Latest commit: feature/whats-new
// Author : Gerrah
// Purpose : Shows the picture a release note names (see releasePictures); a
// name with no picture yet shows nothing.

import { releasePictures } from "./releasePictures";

export function ReleasePicture({ name }: { name: string | undefined }) {
  const Picture = name ? releasePictures[name] : undefined;
  return Picture ? <Picture /> : null;
}
