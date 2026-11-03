// File : /TeamSamsara.Workflow/app/src/features/sign-in-photos/ui/SignInPhotosCard.tsx
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : The sign-in page's pictures in Settings › General, for
// Administrators: add one (made smaller first), move it earlier or later,
// or remove it. Each change saves straight away.

import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { dataErrorMessage } from "@/core/data";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { IconButton } from "@/shared/components/Button/IconButton";
import { useToast } from "@/shared/components/Toast/useToast";
import { useSignInPhotos } from "../hooks/useSignInPhotos";
import {
  addSignInPhoto,
  moveSignInPhoto,
  removeSignInPhoto,
} from "../service/signInPhotoService";
import { SignInPhotoLimits, type SignInPhoto } from "../types/signInPhotoTypes";
import { SignInPhotosText as Text } from "./signInPhotosContent";
import styles from "./SignInPhotosCard.module.css";

export function SignInPhotosCard() {
  const { photos } = useSignInPhotos();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const isFull = photos.length >= SignInPhotoLimits.count;

  const add = useMutation({
    mutationFn: (file: File) => addSignInPhoto(file, photos),
    onSuccess: () => toast.show({ tone: "success", title: Text.added }),
  });
  const change = useMutation({
    mutationFn: (action: {
      photo: SignInPhoto;
      kind: "earlier" | "later" | "remove";
    }) =>
      action.kind === "remove"
        ? removeSignInPhoto(photos, action.photo)
        : moveSignInPhoto(
            photos,
            action.photo.id,
            action.kind === "earlier" ? -1 : 1,
          ),
    onSuccess: (_result, action) => {
      if (action.kind === "remove")
        toast.show({ tone: "success", title: Text.removed });
    },
  });
  const error = add.error ?? change.error;

  return (
    <section className={styles.card} aria-labelledby="signin-photos">
      <div className={styles.head}>
        <h3 id="signin-photos" className={styles.title}>
          {Text.title}
        </h3>
        <p className={styles.muted}>{Text.description}</p>
      </div>
      {error ? (
        <Banner tone="error">
          {Text.failed}: {dataErrorMessage(error)}
        </Banner>
      ) : null}
      {photos.length === 0 ? (
        <p className={styles.muted}>{Text.empty}</p>
      ) : (
        <ol className={styles.grid}>
          {photos.map((photo, index) => (
            <li key={photo.id} className={styles.item}>
              <img
                src={photo.url}
                alt={Text.picture(index + 1)}
                className={styles.thumb}
              />
              <span className={styles.tools}>
                <IconButton
                  icon="previous"
                  label={Text.earlier}
                  size="small"
                  disabled={index === 0 || change.isPending}
                  onClick={() => change.mutate({ photo, kind: "earlier" })}
                />
                <IconButton
                  icon="next"
                  label={Text.later}
                  size="small"
                  disabled={index === photos.length - 1 || change.isPending}
                  onClick={() => change.mutate({ photo, kind: "later" })}
                />
                <IconButton
                  icon="trash"
                  label={Text.remove}
                  size="small"
                  disabled={change.isPending}
                  onClick={() => change.mutate({ photo, kind: "remove" })}
                />
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className={styles.add}>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className={styles.file}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) add.mutate(file);
          }}
        />
        <Button
          iconStart="upload"
          onClick={() => input.current?.click()}
          disabled={isFull}
          isLoading={add.isPending}
        >
          {Text.add}
        </Button>
        <span className={styles.muted}>
          {isFull ? Text.full(SignInPhotoLimits.count) : Text.help}
        </span>
      </div>
    </section>
  );
}
