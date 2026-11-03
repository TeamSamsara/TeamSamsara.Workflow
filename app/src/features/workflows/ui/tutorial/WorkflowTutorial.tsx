// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/tutorial/WorkflowTutorial.tsx
// Version : 1.0.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : The tutorial shown the first time someone opens Workflows: four
// short slides with a drawn example each, ending with "Create my first
// workflow" for people who can make one.

import { useState } from "react";
import { Button } from "@/shared/components/Button/Button";
import { Chip } from "@/shared/components/Chip/Chip";
import { Modal } from "@/shared/components/Modal/Modal";
import { Icon } from "@/shared/icons/Icon";
import { TutorialText as Text } from "./tutorialContent";
import styles from "./WorkflowTutorial.module.css";

interface WorkflowTutorialProps {
  /** Whether the person may make workflows (then the last slide offers it). */
  canCreate: boolean;
  /** With workflows already made, the last button says "another" rather than "first". */
  hasWorkflows: boolean;
  onStartGuide: () => void;
  onClose: () => void;
}

const example = Text.example;

function WorkflowPicture() {
  return (
    <div className={styles.miniCard}>
      <span className={styles.miniTitle}>{example.workflow}</span>
      <ul className={styles.miniList}>
        {example.tasks.map((task) => (
          <li key={task} className={styles.miniTask}>
            <span className={styles.tick} aria-hidden="true" />
            {task}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WhoWhenPicture() {
  return (
    <ul className={styles.miniCard}>
      {example.rows.map((row) => (
        <li key={row.title} className={styles.miniRow}>
          <b>{row.title}</b>
          <span className={styles.rowMeta}>
            <Chip label={row.who} variant="outline" />
            <span className={styles.when}>
              <Icon name="time" />
              {row.when}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function EventPicture() {
  return (
    <div className={styles.flow}>
      <div className={styles.event}>
        <Icon name="calendar" />
        <span>
          <b>{example.event}</b>
          <span className={styles.muted}>{example.eventType}</span>
        </span>
      </div>
      <Icon name="next" className={styles.arrow} />
      <ul className={styles.miniCard}>
        {example.dated.map((task) => (
          <li key={task.title} className={styles.miniTask}>
            <span className={styles.date}>{task.when}</span>
            {task.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailsPicture() {
  return (
    <div className={styles.chips}>
      {example.sections.map((section) => (
        <Chip key={section} label={section} />
      ))}
    </div>
  );
}

const pictures = [
  WorkflowPicture,
  WhoWhenPicture,
  EventPicture,
  DetailsPicture,
];

export function WorkflowTutorial({
  canCreate,
  hasWorkflows,
  onStartGuide,
  onClose,
}: WorkflowTutorialProps) {
  const [index, setIndex] = useState(0);
  const slides = Text.slides;
  const slide = slides[index];
  const Picture = pictures[index];
  const isLast = index === slides.length - 1;

  const footer = (
    <div className={styles.footer}>
      <span
        className={styles.dots}
        aria-label={Text.slideLabel(index, slides.length)}
      >
        {slides.map((entry, at) => (
          <span
            key={entry.title}
            className={styles.dot}
            data-current={at === index}
          />
        ))}
      </span>
      <span className={styles.buttons}>
        {index > 0 ? (
          <Button variant="ghost" onClick={() => setIndex(index - 1)}>
            {Text.back}
          </Button>
        ) : null}
        {!isLast ? (
          <Button
            variant="primary"
            iconEnd="next"
            onClick={() => setIndex(index + 1)}
          >
            {Text.next}
          </Button>
        ) : canCreate ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              {Text.notNow}
            </Button>
            <Button variant="primary" iconStart="add" onClick={onStartGuide}>
              {hasWorkflows ? Text.startAnother : Text.start}
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={onClose}>
            {Text.gotIt}
          </Button>
        )}
      </span>
    </div>
  );

  return (
    <Modal
      title={Text.dialogTitle}
      onClose={onClose}
      footer={footer}
      size="wide"
    >
      <div className={styles.slide} aria-live="polite">
        <div className={styles.picture} aria-hidden="true">
          <Picture />
        </div>
        <div className={styles.words}>
          <h3 className={styles.title}>{slide.title}</h3>
          <p className={styles.body}>{slide.body}</p>
        </div>
      </div>
    </Modal>
  );
}
