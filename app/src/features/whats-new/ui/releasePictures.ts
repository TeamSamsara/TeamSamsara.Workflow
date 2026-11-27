// File : /TeamSamsara.Workflow/app/src/features/whats-new/ui/releasePictures.ts
// Version : 1.1.0
// Latest commit: feature/1.2-docs-seed
// Author : Gerrah
// Purpose : The pictures a release note can name (its `picture`), drawn from
// the app's own pieces so they always look like Playbook. The help's
// pictures (docPictures) can be named too, so a release and its article show
// the same thing.

import type { ComponentType } from "react";
import { docPictures } from "@/features/onboarding";

export const releasePictures: Record<string, ComponentType> = {
  ...docPictures,
};

export function hasPicture(name: string | undefined): boolean {
  return Boolean(name && releasePictures[name]);
}
