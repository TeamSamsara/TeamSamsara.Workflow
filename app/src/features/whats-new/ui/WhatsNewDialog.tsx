// File : /TeamSamsara.Workflow/app/src/features/whats-new/ui/WhatsNewDialog.tsx
// Version : 1.0.0
// Latest commit: feature/whats-new
// Author : Gerrah
// Purpose : What's new, the first time someone opens Playbook after a
// release: its highlights one at a time (a picture when it has one, what
// changed, a link to how it works), then Got it. Closing it in any way marks
// the release as seen. Nothing shows while there are no release notes.

import { highlightsOf } from "@releases/index";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useDisplayTime } from "@/core/workspace";
import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import { docsPath, WhatsNewArticle } from "@/shared/constants/routePaths";
import { useWhatsNew } from "../hooks/useWhatsNew";
import { ReleasePicture } from "./ReleasePicture";
import { hasPicture } from "./releasePictures";
import { releaseDay, WhatsNewText as Text } from "./whatsNewContent";
import styles from "./WhatsNew.module.css";

export function WhatsNewDialog() {
  const { release, dismiss } = useWhatsNew();
  const time = useDisplayTime();
  const [at, setAt] = useState(0);
  if (!release) return null;
  const changes = highlightsOf(release);
  if (changes.length === 0) return null;
  const index = Math.min(at, changes.length - 1);
  const change = changes[index];
  const last = index === changes.length - 1;

  return (
    <Modal
      title={Text.panelTitle(release.version)}
      description={Text.released(releaseDay(release.date, time.dateFormat))}
      size="wide"
      onClose={dismiss}
      footer={
        <div className={styles.footer}>
          <span
            className={styles.dots}
            aria-label={Text.position(index + 1, changes.length)}
          >
            {changes.map((entry, i) => (
              <button
                key={entry.title}
                type="button"
                className={styles.dot}
                aria-label={Text.show(i + 1, changes.length)}
                aria-current={i === index}
                onClick={() => setAt(i)}
              />
            ))}
          </span>
          <Link
            to={docsPath(WhatsNewArticle)}
            className={styles.everything}
            onClick={dismiss}
          >
            {Text.everything(release.version)}
          </Link>
          <span className={styles.buttons}>
            {index > 0 ? (
              <Button variant="ghost" onClick={() => setAt(index - 1)}>
                {Text.back}
              </Button>
            ) : null}
            <Button
              variant="primary"
              onClick={() => (last ? dismiss() : setAt(index + 1))}
            >
              {last ? Text.gotIt : Text.next}
            </Button>
          </span>
        </div>
      }
    >
      <div className={styles.panel}>
        {hasPicture(change.picture) ? (
          <div className={styles.picture} aria-hidden="true">
            <ReleasePicture name={change.picture} />
          </div>
        ) : null}
        <div className={styles.change}>
          <span className={styles.kind} data-kind={change.kind}>
            {Text.kinds[change.kind]}
          </span>
          <h3 className={styles.changeTitle}>{change.title}</h3>
          <p className={styles.body}>{change.body}</p>
          {change.article ? (
            <Link
              to={docsPath(change.article)}
              className={styles.more}
              onClick={dismiss}
            >
              {Text.howItWorks}
            </Link>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
