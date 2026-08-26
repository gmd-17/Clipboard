// src/types/index.ts
import type { Database } from "./old_supabase";

// ---- Hand-written unions (Postgres CHECK constraints aren't captured
// by the type generator, so these two are maintained manually) ----
export type TagColor =
  "none" | "red" | "amber" | "emerald" | "blue" | "purple" | "rose";
export type ItemType = "text" | "image" | "pdf" | "docx" | "url" | "file";

// ---- Raw generated row shapes, for reference/reuse ----
type DbBoards = Database["public"]["Tables"]["boards"]["Row"];
type DbClips = Database["public"]["Tables"]["clips"]["Row"];
type DbClipItems = Database["public"]["Tables"]["clip_items"]["Row"];

// ---- App-facing types: generated row + correct unions + UI-only fields ----
export interface ClipItem extends Omit<DbClipItems, "type"> {
  type: ItemType;
}

export interface ClipCard extends Omit<DbClips, "tag"> {
  tag: TagColor;
  items: ClipItem[]; // joined client-side, not a real DB column
}

export type Board = DbBoards;
