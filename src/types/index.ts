// src/types/index.ts
import type { Database } from "./supabase";

// ---- Hand-written unions (Postgres CHECK constraints aren't captured
// by the type generator, so these are maintained manually) ----
export type TagColor =
  "none" | "red" | "amber" | "emerald" | "blue" | "purple" | "rose";
export type ItemType = "text" | "image" | "pdf" | "docx" | "url" | "file";

// ---- Raw generated row shapes ----
type DbBoards = Database["public"]["Tables"]["boards"]["Row"];
type DbClips = Database["public"]["Tables"]["clips"]["Row"];
type DbCardGroups = Database["public"]["Tables"]["card_groups"]["Row"];
type DbBoardShares = Database["public"]["Tables"]["board_shares"]["Row"];

// ---- App-facing types: generated row + correct unions ----

export type Board = DbBoards;

export interface CardGroup extends Omit<DbCardGroups, "color"> {
  color: TagColor | null;
}

// A "card" IS the item now — no nested items array, no clip_items table.
export interface ClipCard extends Omit<DbClips, "tag" | "type"> {
  tag: TagColor;
  type: ItemType;
}

export type BoardShare = DbBoardShares;

// ---- Shape returned by the get_shared_board_cards RPC ----
// (this is NOT a table row — it's the RPC's custom return columns,
// so it isn't in Database['public']['Tables'] and must be hand-typed)
export interface SharedCard {
  id: string;
  note: string | null;
  pinned: boolean;
  tag: TagColor;
  type: ItemType;
  content: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  ocr_text: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_site_name: string | null;
  og_favicon: string | null;
  position: number;
  group_id: string | null;
  group_name: string | null;
  group_color: TagColor | null;
  created_at: string;
}
