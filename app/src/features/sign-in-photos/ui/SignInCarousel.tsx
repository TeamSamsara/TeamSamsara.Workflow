// File : /TeamSamsara.Workflow/app/src/features/sign-in-photos/ui/SignInCarousel.tsx
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : The sign-in page's pictures behind its welcome: one at a time,
// fading to the next every few seconds, darkened so the words stay readable,
// with dots to pick one. People who ask for less motion see the first one
// only, unless they pick another. Nothing at all when there are none.

import { useEffect, useState } from "react";
import { useSignInPhotos } from "../hooks/useSignInPhotos";
import { SignInPhotosText as Text } from "./signInPhotosContent";
import styles from "./SignInCarousel.module.css";

const showFor = 6000;

function prefersLessMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

export function SignInCarousel() {
  const { photos } = useSignInPhotos();
  const [shown, setShown] = useState(0);
  const count = photos.length;
  const current = count > 0 ? shown % count : 0;

  useEffect(() => {
    if (count < 2 || prefersLessMotion()) return;
    const timer = window.setInterval(
      () => setShown((index) => (index + 1) % count),
      showFor,
    );
    return () => window.clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  return (
    <>
      <div className={styles.photos} aria-hidden>
        {photos.map((photo, index) => (
          <img
            key={photo.id}
            src={photo.url}
            alt=""
            className={styles.photo}
            data-shown={index === current || undefined}
          />
        ))}
        <span className={styles.shade} />
      </div>
      {count > 1 ? (
        <div className={styles.dots} role="group" aria-label={Text.pictures}>
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              className={styles.dot}
              aria-label={Text.show(index + 1, count)}
              aria-pressed={index === current}
              onClick={() => setShown(index)}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
