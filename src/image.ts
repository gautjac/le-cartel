// Downscale a chosen/captured image to ~maxW px wide JPEG for upload.
// Returns { dataUrl, base64 } — base64 is the payload for Claude (no prefix).
export async function downscaleToJpeg(
  file: Blob,
  maxW = 1024,
  quality = 0.8
): Promise<{ dataUrl: string; base64: string }> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, maxW / bitmap.width);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponible");
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h);
  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return { dataUrl, base64 };
}

async function loadBitmap(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image illisible"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
