// File : /TeamSamsara.Workflow/app/src/features/onboarding/ui/WalkthroughCard.tsx
// Version : 1.0.0
// Latest commit: feature/onboarding
// Author : Gerrah
// Purpose : The card on the calendar while someone has walkthrough chapters
// left: which are done, which is next, Continue, and a button to hide it.
// Chapters that are new for them (after a new role) are marked as such.

import { Button } from "@/shared/components/Button/Button";
import { IconButton } from "@/shared/components/Button/IconButton";
import { Icon } from "@/shared/icons/Icon";
import { totalMinutes } from "../model/chapters";
import { useWalkthrough } from "../hooks/useWalkthrough";
import { CardText as Text } from "./onboardingContent";
import styles from "./WalkthroughCard.module.css";

export function WalkthroughCard() {
  const walkthrough = useWalkthrough();
  const { chapters, left, record } = walkthrough;
  if (!record || record.hidden || left.length === 0 || walkthrough.isRunning)
    return null;
  const done = chapters.length - left.length;
  // Finished it once, and a new role brought new chapters.
  const isNew = record.done.includes("yours");

  return (
    <section className={styles.card} aria-labelledby="walkthrough-card">
      <div className={styles.text}>
        <div className={styles.head}>
          <h2 id="walkthrough-card" className={styles.title}>
            {isNew ? Text.newForYou : Text.title}
          </h2>
          <span className={styles.progress}>
            {Text.progress(done, chapters.length, totalMinutes(left))}
          </span>
        </div>
        <ul className={styles.chips}>
          {chapters.map((chapter) => {
            const isDone = !left.includes(chapter);
            return (
              <li
                key={chapter.id}
                className={styles.chip}
                data-state={
                  isDone ? "done" : chapter === left[0] ? "next" : "todo"
                }
              >
                {isDone ? <Icon name="check" /> : null}
                {chapter.title}
              </li>
            );
          })}
        </ul>
      </div>
      <Button
        variant="primary"
        iconEnd="next"
        onClick={() => walkthrough.start()}
      >
        {Text.continueWith(left[0].title)}
      </Button>
      <IconButton
        icon="close"
        variant="ghost"
        label={Text.hide}
        onClick={walkthrough.hide}
        className={styles.hide}
      />
    </section>
  );
}
