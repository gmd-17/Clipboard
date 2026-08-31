import { supabase } from "../supabase";
import * as guestDb from "../storage/guestStorage";
import type { Board } from "../../types";

export type CreateBoardInput = Omit<
  Board,
  "id" | "created_at" | "updated_at" | "user_id"
>;

export async function createBoard(
  isGuest: boolean,
  userId: string,
  board: CreateBoardInput,
): Promise<Board> {
  if (isGuest) {
    const now = new Date().toISOString();

    const created: Board = {
      ...board,
      id: crypto.randomUUID(),
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    await guestDb.putBoard(created);
    return created;
  }

  const { data, error } = await supabase
    .from("boards")
    .insert({
      ...board,
      user_id: userId,
    })
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export async function updateBoard(
  isGuest: boolean,
  id: string,
  patch: Partial<Omit<Board, "id" | "user_id" | "created_at" | "updated_at">>,
): Promise<Board> {
  if (isGuest) {
    const guest = await guestDb.loadGuestData();
    const existing = guest.boards.find((board) => board.id === id);

    if (!existing) {
      throw new Error(`Guest board ${id} was not found.`);
    }

    const updated: Board = {
      ...existing,
      ...patch,
      updated_at: new Date().toISOString(),
    };

    await guestDb.putBoard(updated);
    return updated;
  }

  const { data, error } = await supabase
    .from("boards")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export async function deleteBoard(isGuest: boolean, id: string): Promise<void> {
  if (isGuest) {
    await guestDb.deleteBoardCascade(id);
    return;
  }

  // Cloud deletion relies on the database FK cascade from boards to its
  // related card_groups/clips. Do not duplicate that cascade in the client.
  // If that FK is not configured with ON DELETE CASCADE, this operation will
  // fail with an FK violation; that assumption needs to be verified separately.
  const { error } = await supabase.from("boards").delete().eq("id", id);

  if (error) throw error;
}
