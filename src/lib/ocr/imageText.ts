import { createWorker } from "tesseract.js";

const rasterizeSvg = async (file: Blob): Promise<Blob> => {
  const svgUrl = URL.createObjectURL(file);

  try {
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Failed to load SVG image."));
      image.src = svgUrl;
    });

    const width = image.naturalWidth || 1200;
    const height = image.naturalHeight || 1200;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to create canvas context for SVG OCR.");
    }

    context.drawImage(image, 0, 0, width, height);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to rasterize SVG for OCR."));
        }
      }, "image/png");
    });

    return pngBlob;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
};

export async function extractImageText(file: Blob): Promise<string> {
  console.log("[imageText] Starting OCR:", {
    type: file.type,
    size: file.size,
  });

  const ocrFile =
    file.type === "image/svg+xml" ? await rasterizeSvg(file) : file;

  const worker = await createWorker("eng");

  try {
    const result = await worker.recognize(ocrFile);

    const text = result.data.text.trim();

    console.log("[imageText] OCR complete:", {
      characters: text.length,
    });

    return text;
  } finally {
    await worker.terminate();
  }
}
