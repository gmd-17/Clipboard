import { supabase } from "../supabase";
import * as guestDb from "../storage/guestStorage";
import type { Board, ClipCard, ItemType } from "../../types";

export type CreateCardInput = Omit<
  ClipCard,
  "id" | "created_at" | "updated_at" | "user_id"
> & {
  /**
   * A file Blob is supplied by the eventual paste/drop/file-picker layer.
   * It is intentionally optional because this API can also create ordinary
   * text/URL cards.
   *
   * Cloud mode uploads this Blob to Supabase Storage.
   * Guest mode stores this Blob in IndexedDB.
   */
  file?: Blob;
};

type CardPatch = Partial<
  Omit<ClipCard, "id" | "user_id" | "created_at" | "updated_at">
>;

const FILE_TYPES: ItemType[] = ["image", "pdf", "docx", "file"];

function isFileCard(type: ItemType): boolean {
  return FILE_TYPES.includes(type);
}

function calculateExpiry(
  expiresAt: string | null | undefined,
  board: Board,
): string | null {
  // An explicitly supplied value always wins. null intentionally means
  // "never expires", which is different from "not supplied".
  if (expiresAt !== undefined) {
    return expiresAt;
  }

  // ttl_hours belongs to the board. It is only the default used when the
  // individual card has not supplied its own expiry override.
  return new Date(Date.now() + board.ttl_hours * 60 * 60 * 1000).toISOString();
}

async function getCloudBoard(boardId: string): Promise<Board> {
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .single();

  if (error) throw error;

  return data;
}

async function getGuestBoard(boardId: string): Promise<Board> {
  const guest = await guestDb.loadGuestData();
  const board = guest.boards.find((item) => item.id === boardId);

  if (!board) {
    throw new Error(`Guest board ${boardId} was not found.`);
  }

  return board;
}

export async function createCard(
  isGuest: boolean,
  userId: string,
  card: CreateCardInput,
): Promise<ClipCard> {
  const board = isGuest
    ? await getGuestBoard(card.board_id)
    : await getCloudBoard(card.board_id);

  const expiresAt = calculateExpiry(card.expires_at, board);

  if (isGuest) {
    const now = new Date().toISOString();

    const { file, ...cardData } = card;

    const created: ClipCard = {
      ...cardData,
      id: crypto.randomUUID(),
      user_id: userId,
      expires_at: expiresAt,
      created_at: now,
      updated_at: now,
    };

    /*
     * Cloud file data lives in Supabase Storage; guest file data lives in
     * IndexedDB's files store. Neither should ever hold base64.
     *
     * IndexedDB can store the original Blob directly, so guest mode does not
     * need to convert large files into strings just to persist them.
     */
    await guestDb.putCard(created);

    if (file) {
      await guestDb.putFile(created.id, file);
    }

    return created;
  }

  const { file, ...cardData } = card;

  const { data: inserted, error: insertError } = await supabase
    .from("clips")
    .insert({
      ...cardData,
      user_id: userId,
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (insertError) throw insertError;

  let created = inserted as ClipCard;

  if (!file || !isFileCard(created.type)) {
    return created;
  }

  if (!created.file_name) {
    throw new Error("A file card requires file_name before upload.");
  }

  /*
   * Storage upload order is intentionally strict:
   *
   * 1. The database row already exists, so we have the real clip ID.
   * 2. Upload to {userId}/{clipId}/{fileName}.
   * 3. Generate a signed URL and save it as content.
   *
   * We never put base64 file data into the clips.content column.
   */
  const filePath = `${userId}/${created.id}/${created.file_name}`;

  const { error: uploadError } = await supabase.storage
    .from("clip-files")
    .upload(filePath, file, {
      upsert: false,
      contentType: created.mime_type ?? file.type,
    });

  if (uploadError) {
    // The row is intentionally not hidden behind a fake transaction. The
    // caller gets the real Storage error and can decide how to recover.
    throw uploadError;
  }

  const { data: signedUrl, error: signedUrlError } = await supabase.storage
    .from("clip-files")
    .createSignedUrl(filePath, 3600);

  if (signedUrlError) throw signedUrlError;

  const { data: updated, error: updateError } = await supabase
    .from("clips")
    .update({
      content: signedUrl.signedUrl,
      file_path: filePath,
    })
    .eq("id", created.id)
    .select("*")
    .single();

  if (updateError) throw updateError;

  created = updated as ClipCard;

  return created;
}

export async function getCardFile(
  isGuest: boolean,
  card: ClipCard,
): Promise<Blob | undefined> {
  if (!isFileCard(card.type)) {
    return undefined;
  }

  if (isGuest) {
    /*
     * Guest files are stored directly as Blobs in IndexedDB.
     * We read the Blob rather than converting it to base64, because the
     * whole point of the guest files store is to keep large binary data
     * out of localStorage and out of the card's text content.
     */
    return guestDb.getFile(card.id);
  }

  if (!card.file_path) {
    return undefined;
  }

  /*
   * Cloud files live in the private Supabase Storage bucket. The API layer
   * already knows the storage path, so the Card component doesn't need to
   * know anything about Supabase Storage or signed URLs.
   */
  const { data, error } = await supabase.storage
    .from("clip-files")
    .download(card.file_path);

  if (error) {
    throw error;
  }

  return data;
}

export async function updateCard(
  isGuest: boolean,
  id: string,
  patch: CardPatch,
): Promise<ClipCard> {
  if (isGuest) {
    const guest = await guestDb.loadGuestData();
    const existing = guest.cards.find((card) => card.id === id);

    if (!existing) {
      throw new Error(`Guest card ${id} was not found.`);
    }

    const updated: ClipCard = {
      ...existing,
      ...patch,
      updated_at: new Date().toISOString(),
    };

    await guestDb.putCard(updated);
    return updated;
  }

  const { data, error } = await supabase
    .from("clips")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return data as ClipCard;
}

export async function deleteCard(isGuest: boolean, id: string): Promise<void> {
  if (isGuest) {
    await guestDb.deleteCard(id);
    return;
  }

  const { error } = await supabase.from("clips").delete().eq("id", id);

  if (error) throw error;
}

export async function moveCard(
  isGuest: boolean,
  id: string,
  newPosition: number,
  newGroupId: string | null,
): Promise<ClipCard> {
  return updateCard(isGuest, id, {
    position: newPosition,
    group_id: newGroupId,
  });
}
