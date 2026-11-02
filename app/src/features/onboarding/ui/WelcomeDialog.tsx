// File : /TeamSamsara.Workflow/app/src/features/onboarding/ui/WelcomeDialog.tsx
// Version : 1.0.0
// Latest commit: feature/onboarding
// Author : Gerrah
// Purpose : What someone sees the first time they sign in: what Workflow is,
// and the walkthrough's chapters for what they can do, with how long it takes.
// They start it, or leave it for later (it waits on their calendar).

import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import { totalMinutes, type Chapter } from "../model/chapters";
import { WelcomeText as Text } from "./onboardingContent";
import styles from "./OnboardingDialogs.module.css";

interface WelcomeDialogProps {
  name: string;
  chapters: readonly Chapter[];
  onStart: () => void;
  onLater: () => void;
}

export function WelcomeDialog({
  name,
  chapters,
  onStart,
  onLater,
}: WelcomeDialogProps) {
  return (
    <Modal
      title={Text.title(name)}
      onClose={onLater}
      footer={
        <>
          <Button variant="ghost" onClick={onLater}>
            {Text.later}
          </Button>
          <Button variant="primary" iconEnd="next" onClick={onStart} autoFocus>
            {Text.start}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <p className={styles.lead}>{Text.body}</p>
        <p className={styles.muted}>{Text.intro(totalMinutes(chapters))}</p>
        <ol className={styles.chapters}>
          {chapters.map((chapter) => (
            <li key={chapter.id}>{chapter.title}</li>
          ))}
        </ol>
        <p className={styles.muted}>{Text.laterNote}</p>
      </div>
    </Modal>
  );
}
