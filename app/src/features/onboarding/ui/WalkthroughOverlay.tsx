// File : /TeamSamsara.Workflow/app/src/features/onboarding/ui/WalkthroughOverlay.tsx
// Version : 1.0.0
// Latest commit: feature/onboarding
// Author : Gerrah
// Purpose : One walkthrough step on the real page: the part it's about lit up
// (everything else dimmed) and a note beside it with the chapter, how far
// along it is, and Back / Next / Skip chapter. The page stays usable, so "try
// it" steps can be tried. If the part isn't on the page (a small screen, an
// empty list), the note sits in the middle instead.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/shared/components/Button/Button";
import { IconButton } from "@/shared/components/Button/IconButton";
import type { TourStep } from "../model/chapters";
import { tourAttribute } from "./TourTarget";
import { WalkthroughText as Text } from "./onboardingContent";
import styles from "./WalkthroughOverlay.module.css";

interface WalkthroughOverlayProps {
  step: TourStep;
  chapterTitle: string;
  /** Where this step is in the whole walkthrough, from 1. */
  position: number;
  total: number;
  isFirst: boolean;
  isLastOfChapter: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkipChapter: () => void;
  onClose: () => void;
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const gap = 12;
const calloutWidth = 360;

/** The part's box; a TourTarget has none of its own, so it's what's inside it. */
function boxOf(element: Element): Box | null {
  const own = element.getBoundingClientRect();
  const rects =
    own.width > 0 || own.height > 0
      ? [own]
      : [...element.children]
          .map((child) => child.getBoundingClientRect())
          .filter((rect) => rect.width > 0 || rect.height > 0);
  if (rects.length === 0) return null;
  const top = Math.min(...rects.map((rect) => rect.top));
  const left = Math.min(...rects.map((rect) => rect.left));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  const right = Math.max(...rects.map((rect) => rect.right));
  return { top, left, width: right - left, height: bottom - top };
}

/** Beside the part where there's room: right, left, below, then above. */
function placeCallout(box: Box | null, height: number): CSSProperties {
  const width = window.innerWidth;
  const tall = window.innerHeight;
  if (!box || width < 640) return {};
  const clampTop = (top: number) =>
    Math.max(gap, Math.min(top, tall - height - gap));
  const clampLeft = (left: number) =>
    Math.max(gap, Math.min(left, width - calloutWidth - gap));
  if (box.left + box.width + gap + calloutWidth < width - gap)
    return { top: clampTop(box.top), left: box.left + box.width + gap };
  if (box.left - gap - calloutWidth > gap)
    return { top: clampTop(box.top), left: box.left - gap - calloutWidth };
  if (box.top + box.height + gap + height < tall - gap)
    return { top: box.top + box.height + gap, left: clampLeft(box.left) };
  return { top: clampTop(box.top - gap - height), left: clampLeft(box.left) };
}

export function WalkthroughOverlay({
  step,
  chapterTitle,
  position,
  total,
  isFirst,
  isLastOfChapter,
  onBack,
  onNext,
  onSkipChapter,
  onClose,
}: WalkthroughOverlayProps) {
  const [box, setBox] = useState<Box | null>(null);
  const [isLost, setIsLost] = useState(false);
  const callout = useRef<HTMLDivElement>(null);
  const [calloutHeight, setCalloutHeight] = useState(240);

  // Finds the part (pages load in their own time), scrolls it into view once,
  // and follows it as the page scrolls or resizes.
  useEffect(() => {
    let scrolled = false;
    let tries = 0;
    const selector = `[${tourAttribute}="${step.target}"]`;
    function measure() {
      const element = document.querySelector(selector);
      const next = element ? boxOf(element) : null;
      if (element && next && !scrolled) {
        scrolled = true;
        const first = element.firstElementChild ?? element;
        first.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      tries += 1;
      setBox(next);
      setIsLost(!next && tries > 8);
    }
    measure();
    const timer = window.setInterval(measure, 250);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step.target, step.path]);

  useEffect(() => {
    callout.current?.focus();
    setCalloutHeight(callout.current?.offsetHeight ?? 240);
  }, [step]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const pad = 6;
  const spotlight: CSSProperties | null = box
    ? {
        top: box.top - pad,
        left: box.left - pad,
        width: box.width + pad * 2,
        height: box.height + pad * 2,
      }
    : null;
  const placed = placeCallout(box, calloutHeight);
  const isPlaced = "top" in placed;

  return (
    <div className={styles.layer}>
      {spotlight ? (
        <div className={styles.spotlight} style={spotlight} aria-hidden />
      ) : (
        <div className={styles.dim} aria-hidden />
      )}
      <div
        ref={callout}
        role="dialog"
        aria-modal="false"
        aria-labelledby="walkthrough-title"
        tabIndex={-1}
        className={styles.callout}
        data-placed={isPlaced || undefined}
        style={placed}
      >
        <div className={styles.head}>
          <span className={styles.chapter}>{chapterTitle}</span>
          <span className={styles.count}>{Text.stepOf(position, total)}</span>
          <IconButton
            icon="close"
            variant="ghost"
            size="small"
            label={Text.close}
            onClick={onClose}
          />
        </div>
        <div className={styles.bar} aria-hidden>
          <span style={{ width: `${Math.round((position / total) * 100)}%` }} />
        </div>
        <h2 id="walkthrough-title" className={styles.title}>
          {step.title}
        </h2>
        <p className={styles.body}>{step.body}</p>
        {isLost ? <p className={styles.note}>{Text.lost}</p> : null}
        {step.tryIt && !isLost ? (
          <span className={styles.tryIt}>{Text.tryIt}</span>
        ) : null}
        <div className={styles.actions}>
          <Button variant="ghost" size="small" onClick={onSkipChapter}>
            {Text.skipChapter}
          </Button>
          <span className={styles.spacer} />
          {!isFirst ? (
            <Button variant="ghost" onClick={onBack}>
              {Text.back}
            </Button>
          ) : null}
          <Button variant="primary" onClick={onNext}>
            {isLastOfChapter && position === total ? Text.done : Text.next}
          </Button>
        </div>
      </div>
    </div>
  );
}
