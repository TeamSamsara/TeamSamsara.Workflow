// File : /TeamSamsara.Workflow/app/src/features/whats-new/ui/releasePictures.ts
// Version : 1.0.0
// Latest commit: feature/whats-new
// Author : Gerrah
// Purpose : The pictures a release note can name (its `picture`), drawn from
// the app's own pieces so they always look like Playbook. Each is made with
// the note it goes with, and listed here by its name.

import type { ComponentType } from "react";

export const releasePictures: Record<string, ComponentType> = {};

export function hasPicture(name: string | undefined): boolean {
  return Boolean(name && releasePictures[name]);
}
