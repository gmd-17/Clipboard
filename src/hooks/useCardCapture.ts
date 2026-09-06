import { useCallback, useEffect, useState } from "react";
import type { ClipCard } from "../types";
import { EXPIRY_OPTIONS } from "../utils/boardCardUtils";
import {
  detectType,
  getFileType,
  getNextPosition,
} from "../utils/cardCreation";
import type { CreateCardInput } from "../lib/api/cards";
import { extractPdfText } from "../lib/ocr/pdfText";

interface UseCardCaptureOptions {
  activeBoardId: string | null;
  cards: ClipCard[];
  createCard: (payload: CreateCardInput) => Promise<ClipCard>;
  updateCard: (
    cardId: string,
    updates: Partial<CreateCardInput>,
  ) => Promise<ClipCard>;
}

interface UseCardCaptureResult {
  isDraggingFiles: boolean;
  captureMessage: string | null;
}

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable ||
    target.closest("[contenteditable='true']") !== null
  );
};

const isFileDrag = (event: DragEvent): boolean => {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
};

const isInsideIgnoredCaptureArea = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }

  return (
    target.closest("[data-card-modal]") !== null ||
    target.closest("[data-card-file-dropzone]") !== null
  );
};

const getExpiryDate = (): string => {
  const expiryHours = EXPIRY_OPTIONS[0]?.hours ?? 24;
  const expiresAt = new Date();

  expiresAt.setHours(expiresAt.getHours() + expiryHours);

  return expiresAt.toISOString();
};

const createTextPayload = (
  boardId: string,
  content: string,
  position: number,
): CreateCardInput => ({
  board_id: boardId,
  content,
  note: null,
  type: detectType(content),
  tag: "none",
  pinned: false,
  expires_at: getExpiryDate(),
  position,
  group_id: null,
  file_name: null,
  file_path: null,
  file_size: null,
  mime_type: null,
  ocr_text: null,
  og_title: null,
  og_description: null,
  og_image: null,
  og_site_name: null,
  og_favicon: null,
});

const createFilePayload = (
  boardId: string,
  file: File,
  position: number,
): CreateCardInput => ({
  board_id: boardId,
  content: "",
  note: null,
  type: getFileType(file),
  tag: "none",
  pinned: false,
  expires_at: getExpiryDate(),
  position,
  group_id: null,
  file_name: file.name,
  file_path: null,
  file_size: file.size,
  mime_type: file.type || null,
  ocr_text: null,
  og_title: null,
  og_description: null,
  og_image: null,
  og_site_name: null,
  og_favicon: null,
  file,
});

export function useCardCapture({
  activeBoardId,
  cards,
  createCard,
  updateCard,
}: UseCardCaptureOptions): UseCardCaptureResult {
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [captureMessage, setCaptureMessage] = useState<string | null>(null);

  const showCaptureMessage = useCallback((count: number) => {
    setCaptureMessage(count === 1 ? "Card added" : `${count} cards added`);

    window.setTimeout(() => {
      setCaptureMessage(null);
    }, 2000);
  }, []);

  const updatePdfOcr = useCallback(
    async (card: ClipCard, file: File) => {
      if (card.type !== "pdf") {
        return;
      }

      try {
        console.log("[useCardCapture] Extracting PDF text:", {
          cardId: card.id,
          fileName: file.name,
        });

        const extractedText = await extractPdfText(file);

        if (!extractedText) {
          console.log(
            "[useCardCapture] PDF contains no extractable text:",
            file.name,
          );
          return;
        }

        await updateCard(card.id, {
          ocr_text: extractedText,
        });

        console.log("[useCardCapture] PDF text saved:", {
          cardId: card.id,
          characters: extractedText.length,
        });
      } catch (error) {
        console.error(
          "[useCardCapture] Failed to extract PDF text:",
          file.name,
          error,
        );
      }
    },
    [updateCard],
  );

  const createCardsFromFiles = useCallback(
    async (files: File[]) => {
      if (!activeBoardId || files.length === 0) {
        return;
      }

      let nextPosition = getNextPosition(cards, activeBoardId);

      for (const file of files) {
        console.log("[useCardCapture] Creating file card:", {
          name: file.name,
          type: file.type,
          size: file.size,
          position: nextPosition,
        });

        const createdCard = await createCard(
          createFilePayload(activeBoardId, file, nextPosition),
        );

        nextPosition += 1;

        if (createdCard.type === "pdf") {
          void updatePdfOcr(createdCard, file);
        }
      }

      showCaptureMessage(files.length);
    },
    [activeBoardId, cards, createCard, showCaptureMessage, updatePdfOcr],
  );

  const createCardFromText = useCallback(
    async (text: string) => {
      if (!activeBoardId) {
        return;
      }

      const content = text.trim();

      if (!content) {
        return;
      }

      const position = getNextPosition(cards, activeBoardId);

      console.log("[useCardCapture] Creating text card:", {
        content,
        type: detectType(content),
        position,
      });

      await createCard(createTextPayload(activeBoardId, content, position));

      showCaptureMessage(1);
    },
    [activeBoardId, cards, createCard, showCaptureMessage],
  );

  useEffect(() => {
    if (!activeBoardId) {
      return;
    }

    const handlePaste = async (event: ClipboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const clipboardData = event.clipboardData;

      if (!clipboardData) {
        return;
      }

      const files = Array.from(clipboardData.files);

      if (files.length > 0) {
        event.preventDefault();
        await createCardsFromFiles(files);
        return;
      }

      const text = clipboardData.getData("text/plain");

      if (!text.trim()) {
        return;
      }

      event.preventDefault();
      await createCardFromText(text);
    };

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [activeBoardId, createCardFromText, createCardsFromFiles]);

  useEffect(() => {
    if (!activeBoardId) {
      setIsDraggingFiles(false);
      return;
    }

    const handleDragEnter = (event: DragEvent) => {
      if (!isFileDrag(event)) {
        return;
      }

      if (isInsideIgnoredCaptureArea(event.target)) {
        return;
      }

      event.preventDefault();
      setIsDraggingFiles(true);
    };

    const handleDragOver = (event: DragEvent) => {
      if (!isFileDrag(event)) {
        return;
      }

      if (isInsideIgnoredCaptureArea(event.target)) {
        return;
      }

      event.preventDefault();

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }

      setIsDraggingFiles(true);
    };

    const handleDragLeave = (event: DragEvent) => {
      if (!isFileDrag(event)) {
        return;
      }

      if (isInsideIgnoredCaptureArea(event.target)) {
        return;
      }

      if (event.relatedTarget instanceof Node) {
        if (document.contains(event.relatedTarget)) {
          return;
        }
      }

      setIsDraggingFiles(false);
    };

    const handleDrop = async (event: DragEvent) => {
      if (!isFileDrag(event)) {
        return;
      }

      if (isInsideIgnoredCaptureArea(event.target)) {
        return;
      }

      event.preventDefault();
      setIsDraggingFiles(false);

      const files = Array.from(event.dataTransfer?.files ?? []);

      if (files.length === 0) {
        return;
      }

      await createCardsFromFiles(files);
    };

    const handleWindowBlur = () => {
      setIsDraggingFiles(false);
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [activeBoardId, createCardsFromFiles]);

  return {
    isDraggingFiles,
    captureMessage,
  };
}
