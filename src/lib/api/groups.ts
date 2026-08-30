import { supabase } from "../supabase";
import * as guestDb from "../storage/guestStorage";
import type { CardGroup } from "../../types";

export type CreateGroupInput = Omit<
  CardGroup,
  "id" | "created_at" | "updated_at" | "user_id"
>;

export async function createGroup(
  isGuest: boolean,
  userId: string,
  group: CreateGroupInput,
): Promise<CardGroup> {
  if (isGuest) {
    const now = new Date().toISOString();

    const created: CardGroup = {
      ...group,
      id: crypto.randomUUID(),
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    await guestDb.putGroup(created);
    return created;
  }

  const { data, error } = await supabase
    .from("card_groups")
    .insert({
      ...group,
      user_id: userId,
    })
    .select("*")
    .single();

  if (error) throw error;

  return data as CardGroup;
}

export async function updateGroup(
  isGuest: boolean,
  id: string,
  patch: Partial<
    Omit<CardGroup, "id" | "user_id" | "created_at" | "updated_at">
  >,
): Promise<CardGroup> {
  if (isGuest) {
    const guest = await guestDb.loadGuestData();
    const existing = guest.groups.find((group) => group.id === id);

    if (!existing) {
      throw new Error(`Guest group ${id} was not found.`);
    }

    const updated: CardGroup = {
      ...existing,
      ...patch,
      updated_at: new Date().toISOString(),
    };

    await guestDb.putGroup(updated);
    return updated;
  }

  const { data, error } = await supabase
    .from("card_groups")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return data as CardGroup;
}

export async function deleteGroup(isGuest: boolean, id: string): Promise<void> {
  if (isGuest) {
    await guestDb.deleteGroup(id);
    return;
  }

  // Groups are organizational metadata. Before deleting one, explicitly
  // ungroup its cards so the nullable group_id relationship is preserved.
  const { error: cardsError } = await supabase
    .from("clips")
    .update({ group_id: null })
    .eq("group_id", id);

  if (cardsError) throw cardsError;

  const { error } = await supabase.from("card_groups").delete().eq("id", id);

  if (error) throw error;
}
