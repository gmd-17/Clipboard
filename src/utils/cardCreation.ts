// src/utils/cardCreation.ts

import type { ClipCard, ItemType } from "../types";

/**
 * Determine whether text content should be stored as a URL or plain text.
 *
 * This intentionally mirrors AddCardModal's existing behavior:
 * anything accepted by the native URL constructor is a URL.
 */
export function detectType(value: string): ItemType {
  try {
    new URL(value.trim());
    return "url";
  } catch {
    return "text";
  }
}

/**
 * Determine the ClipCard type for an incoming file.
 *
 * Images and PDFs have dedicated card types.
 * Everything else is stored as a generic file card.
 */
export function getFileType(file: File): ItemType {
  if (file.type === "application/pdf") {
    return "pdf";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  return "file";
}

/**
 * Calculate the next board-scoped card position.
 */
export function getNextPosition(cards: ClipCard[], boardId: string): number {
  const boardCards = cards.filter((card) => card.board_id === boardId);

  if (!boardCards.length) {
    return 0;
  }

  return Math.max(...boardCards.map((card) => card.position)) + 1;
}

// /*
//  * Determine whether text content is a URL.
//  */
// const detectType = (value: string): ItemType => {
//   try {
//     new URL(value.trim());
//     return "url";
//   } catch {
//     return "text";
//   }
// };

// /*
//  * Determine the ClipCard type for a file.
//  */
// const getFileType = (file: File): ItemType => {
//   if (file.type === "application/pdf") {
//     return "pdf";
//   }

//   if (file.type.startsWith("image/")) {
//     return "image";
//   }

//   return "file";
// };

// /*
//  * Calculate the next position for a card.
//  */
// const getNextPosition = () => {
//   const boardCards = cards.filter((card) => card.board_id === boardId);

//   if (!boardCards.length) {
//     return 0;
//   }

//   return Math.max(...boardCards.map((card) => card.position)) + 1;
// };
