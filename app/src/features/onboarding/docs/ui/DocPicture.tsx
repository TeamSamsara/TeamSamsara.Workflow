// File : /TeamSamsara.Workflow/app/src/features/onboarding/docs/ui/DocPicture.tsx
// Version : 1.0.0
// Latest commit: feature/docs-refresh
// Author : Gerrah
// Purpose : The picture blocks of a help article: a picture with its numbered
// callouts beside it (picking one lights up its spot), steps side by side
// with a small picture each, the same thing before and after, and a tip.
// Pictures are drawn from the app's own pieces, so they follow the theme.

import { useState } from "react";
import type { Block } from "../articles";
import { docPictures, type PictureName } from "../pictures";
import { ActiveCallout } from "../pictures/activeCallout";
import { DocPictureText as Text } from "./docPictureContent";
import styles from "./DocBlock.module.css";

type PictureBlock = Extract<
  Block,
  { kind: "figure" | "frames" | "compare" | "tip" }
>;

function Picture({ name, label }: { name: PictureName; label: string }) {
  const Drawn = docPictures[name];
  return (
    <div role="img" aria-label={label}>
      <Drawn />
    </div>
  );
}

function Figure({ block }: { block: Extract<Block, { kind: "figure" }> }) {
  const [active, setActive] = useState<number | null>(
    block.callouts.length > 0 ? 1 : null,
  );
  return (
    <figure className={styles.figure}>
      <ActiveCallout.Provider value={active}>
        <Picture name={block.picture} label={block.caption} />
      </ActiveCallout.Provider>
      {block.callouts.length > 0 ? (
        <ol className={styles.callouts} aria-label={Text.callouts}>
          {block.callouts.map((entry, index) => (
            <li key={entry.title}>
              <button
                type="button"
                className={styles.callout}
                aria-pressed={active === index + 1}
                onClick={() => setActive(index + 1)}
              >
                <span className={styles.number} aria-hidden="true">
                  {index + 1}
                </span>
                <span className={styles.calloutText}>
                  <b>{entry.title}</b>
                  <span className={styles.muted}>{entry.text}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      <figcaption className={styles.caption}>{block.caption}</figcaption>
    </figure>
  );
}

export function DocPicture({ block }: { block: PictureBlock }) {
  switch (block.kind) {
    case "figure":
      return <Figure block={block} />;
    case "frames":
      return (
        <ol className={styles.frames}>
          {block.items.map((item, index) => (
            <li key={item.text} className={styles.frame}>
              <Picture name={item.picture} label={item.text} />
              <span>
                <b>{index + 1}.</b> {item.text}
              </span>
            </li>
          ))}
        </ol>
      );
    case "compare":
      return (
        <div className={styles.compare}>
          <div className={styles.side}>
            <span className={styles.sideLabel}>{Text.before}</span>
            <Picture
              name={block.before}
              label={`${Text.before}: ${block.note}`}
            />
          </div>
          <span className={styles.between} aria-hidden="true">
            →
          </span>
          <div className={styles.side}>
            <span className={styles.sideLabel}>{Text.after}</span>
            <Picture
              name={block.after}
              label={`${Text.after}: ${block.note}`}
            />
          </div>
          <p className={styles.note}>{block.note}</p>
        </div>
      );
    case "tip":
      return (
        <aside className={styles.tip}>
          <span>
            <b>{Text.tip}</b> {block.text}
          </span>
        </aside>
      );
  }
}
