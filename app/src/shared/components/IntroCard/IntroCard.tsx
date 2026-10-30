// File : /TeamSamsara.Workflow/app/src/shared/components/IntroCard/IntroCard.tsx
// Version : 1.0.0
// Latest commit: fix/workflow-editor-simpler
// Author : Gerrah
// Purpose : A short "how this works" card at the top of a page, in a few
// numbered steps, that the person closes once they've got it. Pages show it
// again from a "How it works" button.

import { Button } from "@/shared/components/Button/Button";
import { IntroCardText } from "./introCardContent";
import styles from "./IntroCard.module.css";

export interface IntroStep {
  title: string;
  text: string;
}

interface IntroCardProps {
  title: string;
  steps: readonly IntroStep[];
  onDismiss: () => void;
}

export function IntroCard({ title, steps, onDismiss }: IntroCardProps) {
  return (
    <section className={styles.card} aria-labelledby="intro-card-title">
      <header className={styles.header}>
        <h2 id="intro-card-title" className={styles.title}>
          {title}
        </h2>
        <Button size="small" variant="ghost" onClick={onDismiss}>
          {IntroCardText.dismiss}
        </Button>
      </header>
      <ol className={styles.steps}>
        {steps.map((step, index) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.number} aria-hidden="true">
              {index + 1}
            </span>
            <span className={styles.stepText}>
              <b>{step.title}</b>
              <span className={styles.muted}>{step.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
