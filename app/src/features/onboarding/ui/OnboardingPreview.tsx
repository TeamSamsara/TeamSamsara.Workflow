// File : /TeamSamsara.Workflow/app/src/features/onboarding/ui/OnboardingPreview.tsx
// Version : 1.0.0
// Latest commit: feature/onboarding
// Author : Gerrah
// Purpose : In the invite dialog, the walkthrough someone will get for the
// roles picked: their chapters and how long it takes, with the chapters these
// roles don't give shown greyed.

import type { PermissionKey } from "@/core/access";
import { Chapters, chaptersFor, totalMinutes } from "../model/chapters";
import { PreviewText as Text } from "./onboardingContent";
import styles from "./OnboardingPreview.module.css";

export function OnboardingPreview({
  permissions,
}: {
  permissions: ReadonlySet<PermissionKey>;
}) {
  const theirs = chaptersFor(permissions);
  const ids = new Set(theirs.map((chapter) => chapter.id));
  return (
    <section className={styles.preview} aria-labelledby="onboarding-preview">
      <div className={styles.head}>
        <h3 id="onboarding-preview" className={styles.title}>
          {Text.title}
        </h3>
        <span className={styles.summary}>
          {Text.summary(theirs.length, totalMinutes(theirs))}
        </span>
      </div>
      <ul className={styles.chips}>
        {Chapters.map((chapter) => (
          <li
            key={chapter.id}
            className={styles.chip}
            data-on={ids.has(chapter.id) || undefined}
          >
            {chapter.title}
          </li>
        ))}
      </ul>
      <p className={styles.note}>{Text.note}</p>
    </section>
  );
}
