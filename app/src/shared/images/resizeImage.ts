// File : /TeamSamsara.Workflow/app/src/shared/images/resizeImage.ts
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Shrinks a picture in the browser before it's uploaded: reads the
// chosen file, cuts out the part wanted, draws it at the size wanted and
// saves it as WebP (JPEG where the browser can't write WebP). A photo from a
// phone becomes a few hundred kilobytes at most.

/** Opens an image file; refuses anything that isn't a picture it can read. */
export function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file isn't a picture this browser can open."));
    };
    image.src = url;
  });
}

export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** The part of the picture, drawn at width × height. */
export async function renderImage(
  image: CanvasImageSource,
  crop: Crop,
  width: number,
  height: number,
  quality = 0.86,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser can't resize pictures.");
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    width,
    height,
  );
  // Browsers that can't write WebP hand back a PNG instead: use JPEG then.
  const webp = await toBlob(canvas, "image/webp", quality);
  if (webp?.type === "image/webp") return webp;
  const jpeg = await toBlob(canvas, "image/jpeg", quality);
  if (!jpeg) throw new Error("This browser can't resize pictures.");
  return jpeg;
}

/** The whole picture, no wider than maxWidth (never enlarged). */
export function shrinkImage(
  image: HTMLImageElement,
  maxWidth: number,
): Promise<Blob> {
  const scale = Math.min(1, maxWidth / image.naturalWidth);
  return renderImage(
    image,
    { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight },
    Math.round(image.naturalWidth * scale),
    Math.round(image.naturalHeight * scale),
  );
}

/**
 * The square to cut from a picture: the largest centred square, made
 * smaller by zoom (1 = all of it) and moved by offset (−1 … 1 of the room
 * left on each side).
 */
export function squareCrop(
  width: number,
  height: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
): Crop {
  const side = Math.min(width, height) / Math.max(1, zoom);
  const roomX = (width - side) / 2;
  const roomY = (height - side) / 2;
  const clamp = (value: number) => Math.max(-1, Math.min(1, value));
  return {
    x: roomX + clamp(offsetX) * roomX,
    y: roomY + clamp(offsetY) * roomY,
    width: side,
    height: side,
  };
}

/** The file extension for a picture's type. */
export const extensionOf = (blob: Blob) =>
  blob.type === "image/webp" ? "webp" : "jpg";
