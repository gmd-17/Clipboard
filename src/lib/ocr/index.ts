import type { ClipCard } from "../../types";
import { extractImageText } from "./imageText";
import { extractPdfText } from "./pdfText";

export async function extractCardText(
  card: ClipCard,
  file: Blob,
): Promise<string> {
  if (card.type === "pdf") {
    return extractPdfText(file);
  }

  if (card.type === "image") {
    return extractImageText(file);
  }

  return "";
}
