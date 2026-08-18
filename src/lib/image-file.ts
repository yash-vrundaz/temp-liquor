export async function fileToJpegBlob(file: File, maxEdge = 1400, quality = 0.82) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = document.createElement("img");
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read that image."));
      img.src = objectUrl;
    });
    const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process that image.");
    ctx.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (next) => (next ? resolve(next) : reject(new Error("Could not encode that image."))),
        "image/jpeg",
        quality,
      );
    });
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function isInlineImage(src: string) {
  return src.startsWith("data:") || src.startsWith("blob:");
}
