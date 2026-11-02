// File : /TeamSamsara.Workflow/app/src/features/account/ui/PhotoDialog.tsx
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Choosing a profile photo: pick a picture, drag it and zoom to
// frame it in the circle, then save. It's cut to a small square in the
// browser before it's uploaded.

import { useMutation } from "@tanstack/react-query";
import { useRef, useState, type PointerEvent } from "react";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import {
  loadImage,
  renderImage,
  squareCrop,
} from "@/shared/images/resizeImage";
import { photoSize, savePhoto } from "../service/photoService";
import { PhotoText as Text } from "./photoContent";
import styles from "./PhotoDialog.module.css";

interface PhotoDialogProps {
  memberId: string;
  currentUrl: string | null;
  onClose: () => void;
  onSaved: () => void;
}

/** How big the framing circle is on screen, in pixels. */
const frame = 240;

export function PhotoDialog({
  memberId,
  currentUrl,
  onClose,
  onSaved,
}: PhotoDialogProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const crop = image
    ? squareCrop(
        image.naturalWidth,
        image.naturalHeight,
        zoom,
        offset.x,
        offset.y,
      )
    : null;
  const scale = crop ? frame / crop.width : 1;

  const save = useMutation({
    mutationFn: async () => {
      if (!image || !crop) throw new Error(Text.pickFirst);
      const photo = await renderImage(image, crop, photoSize, photoSize);
      return savePhoto(memberId, photo, currentUrl);
    },
    onSuccess: onSaved,
  });

  async function pick(file: File | undefined) {
    if (!file) return;
    setOpenError(null);
    try {
      setImage(await loadImage(file));
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : String(error));
    }
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !image || !crop) return;
    const roomX = (image.naturalWidth - crop.width) / 2;
    const roomY = (image.naturalHeight - crop.height) / 2;
    const dx = (event.clientX - drag.current.x) / scale;
    const dy = (event.clientY - drag.current.y) / scale;
    drag.current = { x: event.clientX, y: event.clientY };
    const clamp = (value: number) => Math.max(-1, Math.min(1, value));
    setOffset((current) => ({
      x: roomX > 0 ? clamp(current.x - dx / roomX) : 0,
      y: roomY > 0 ? clamp(current.y - dy / roomY) : 0,
    }));
  }

  return (
    <Modal
      title={Text.title}
      description={Text.description}
      onClose={onClose}
      dismissible={!save.isPending}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            {Text.cancel}
          </Button>
          <Button
            variant="primary"
            onClick={() => save.mutate()}
            disabled={!image}
            isLoading={save.isPending}
          >
            {Text.save}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        {openError ? <Banner tone="error">{openError}</Banner> : null}
        {save.error ? (
          <Banner tone="error">
            {Text.failed}: {save.error.message}
          </Banner>
        ) : null}
        <input
          ref={input}
          type="file"
          accept="image/*"
          className={styles.file}
          onChange={(event) => void pick(event.target.files?.[0])}
        />
        {image && crop ? (
          <>
            <div
              className={styles.frame}
              style={{ width: frame, height: frame }}
              role="img"
              aria-label={Text.preview}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                drag.current = { x: event.clientX, y: event.clientY };
              }}
              onPointerMove={move}
              onPointerUp={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
            >
              <img
                src={image.src}
                alt=""
                draggable={false}
                className={styles.image}
                style={{
                  width: image.naturalWidth * scale,
                  height: image.naturalHeight * scale,
                  left: -crop.x * scale,
                  top: -crop.y * scale,
                }}
              />
            </div>
            <label className={styles.zoom}>
              {Text.zoom}
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </label>
            <p className={styles.muted}>{Text.dragHelp}</p>
            <Button
              variant="ghost"
              size="small"
              iconStart="upload"
              onClick={() => input.current?.click()}
            >
              {Text.another}
            </Button>
          </>
        ) : (
          <button
            type="button"
            className={styles.pick}
            onClick={() => input.current?.click()}
          >
            {Text.choose}
            <span className={styles.muted}>{Text.chooseHelp}</span>
          </button>
        )}
      </div>
    </Modal>
  );
}
