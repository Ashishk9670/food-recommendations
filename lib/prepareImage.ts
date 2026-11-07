"use client";

// Phone photos are often 3–12MB, and iPhones may hand over HEIC. Vercel caps a
// whole request body at ~4.5MB, so photos are resized and re-encoded as JPEG
// in the browser before upload. Small, already-web-friendly files pass
// through untouched.

export const MAX_EDGE_PX = 1920;
const JPEG_QUALITY = 0.82;
const PASSTHROUGH_MAX_BYTES = 1.5 * 1024 * 1024;
const MAX_GIF_BYTES = 3 * 1024 * 1024;
// Headroom under Vercel's 4.5MB request limit for the form's text fields.
export const MAX_TOTAL_UPLOAD_BYTES = 4 * 1024 * 1024;

const WEB_TYPES = ["image/jpeg", "image/png", "image/webp"];
const HEIC_TYPES = ["image/heic", "image/heif"];

export class PhotoError extends Error {}

function isHeic(file: File) {
  return HEIC_TYPES.includes(file.type) || /\.(heic|heif)$/i.test(file.name);
}

// What the pickers and drag-and-drop accept. Some browsers report HEIC with
// an empty MIME type, so the extension counts too.
export function isAcceptedImage(file: File) {
  return WEB_TYPES.includes(file.type) || file.type === "image/gif" || isHeic(file);
}

type Decoded = { source: CanvasImageSource; width: number; height: number; close: () => void };

async function decode(file: File): Promise<Decoded> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  } catch {
    // Safari decodes HEIC through <img> even where createImageBitmap won't.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
    } catch {
      throw new PhotoError(
        isHeic(file)
          ? `Couldn't read “${file.name}”. HEIC photos only open in Safari — on other browsers, export it as JPEG first.`
          : `Couldn't read “${file.name}” as an image. Please choose a JPEG, PNG or WEBP photo.`,
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function toJpegName(name: string) {
  const base = name.replace(/\.[^.]+$/, "") || "photo";
  return `${base}.jpg`;
}

export async function prepareImage(file: File): Promise<File> {
  if (file.type === "image/gif") {
    // Re-encoding would drop the animation, so GIFs only get a size check.
    if (file.size > MAX_GIF_BYTES) {
      throw new PhotoError(`“${file.name}” is over 3MB. Please choose a smaller GIF or a photo.`);
    }
    return file;
  }

  const decoded = await decode(file);
  try {
    const { width, height } = decoded;
    const fitsAsIs =
      WEB_TYPES.includes(file.type) &&
      file.size <= PASSTHROUGH_MAX_BYTES &&
      Math.max(width, height) <= MAX_EDGE_PX;
    if (fitsAsIs) return file;

    const scale = Math.min(1, MAX_EDGE_PX / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new PhotoError("Your browser couldn't process that photo. Please try another.");
    // JPEG has no transparency; give transparent PNGs a white background
    // rather than black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new PhotoError("Your browser couldn't process that photo. Please try another.");
    return new File([blob], toJpegName(file.name), { type: "image/jpeg", lastModified: file.lastModified });
  } finally {
    decoded.close();
  }
}
