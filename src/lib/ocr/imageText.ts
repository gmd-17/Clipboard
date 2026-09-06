import { createWorker } from "tesseract.js";

export async function extractImageText(file: Blob): Promise<string> {
  console.log("[imageText] Starting OCR:", {
    type: file.type,
    size: file.size,
  });

  const worker = await createWorker("eng");

  try {
    const result = await worker.recognize(file);

    const text = result.data.text.trim();

    console.log("[imageText] OCR complete:", {
      characters: text.length,
    });

    return text;
  } finally {
    await worker.terminate();
  }
}
