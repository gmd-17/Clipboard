import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { Board, CardGroup, ClipCard } from "../../types";
import {
  createSeedBoards,
  createSeedGroups,
  createSeedCards,
  createSeedFiles,
} from "../seedData";

interface ClipboardDB extends DBSchema {
  _meta: {
    key: string;
    value: boolean;
  };

  boards: {
    key: string;
    value: Board;
    indexes: {
      "by-user": string;
    };
  };

  groups: {
    key: string;
    value: CardGroup;
    indexes: {
      "by-board": string;
      "by-user": string;
    };
  };

  cards: {
    key: string;
    value: ClipCard;
    indexes: {
      "by-board": string;
      "by-group": string;
      "by-user": string;
    };
  };

  files: {
    // The card ID is the key so the file always has a direct relationship
    // with the card that owns it.
    key: string;
    value: Blob;
  };
}

const DB_NAME = "clipboard-guest";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<ClipboardDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ClipboardDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // These stores already exist for users upgrading from DB version 1.
        // Only create them during the initial database setup. Without these
        // checks, upgrading v1 -> v2 would try to create existing stores again.
        if (oldVersion < 1) {
          db.createObjectStore("_meta");

          const boards = db.createObjectStore("boards", {
            keyPath: "id",
          });

          boards.createIndex("by-user", "user_id");

          const groups = db.createObjectStore("groups", {
            keyPath: "id",
          });

          groups.createIndex("by-board", "board_id");
          groups.createIndex("by-user", "user_id");

          const cards = db.createObjectStore("cards", {
            keyPath: "id",
          });

          cards.createIndex("by-board", "board_id");
          cards.createIndex("by-group", "group_id");
          cards.createIndex("by-user", "user_id");
        }

        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files");
        }
      },
    });
  }

  return dbPromise;
}

export async function loadGuestData(): Promise<{
  boards: Board[];
  groups: CardGroup[];
  cards: ClipCard[];
}> {
  const db = await getDB();

  /*
   * Generate all seed data from one base time.
   *
   * This keeps board, group, and card timestamps consistent with one another
   * and makes expiry fixtures relative to the moment the guest database is
   * initialized instead of a hard-coded date.
   */
  const now = Date.now();
  const seedBoards = createSeedBoards(now);
  const seedGroups = createSeedGroups(now);
  const seedCards = createSeedCards(now);

  /*
   * Fetch the static files before opening the IndexedDB transaction.
   *
   * We don't want an IndexedDB transaction sitting open while waiting for
   * fetch(). Once the files have been fetched, the transaction below only
   * performs IndexedDB operations.
   */
  const seedFiles = await createSeedFiles();

  const tx = db.transaction(
    ["_meta", "boards", "groups", "cards", "files"],
    "readwrite",
  );

  const initialized = await tx.objectStore("_meta").get("initialized");

  if (!initialized) {
    /*
     * Keep the initialization check and all seed writes in the same
     * transaction. This protects against two startup calls trying to seed
     * the guest database at the same time.
     */
    for (const board of seedBoards) {
      await tx.objectStore("boards").put(board);
    }

    for (const group of seedGroups) {
      await tx.objectStore("groups").put(group);
    }

    const seedFileByCardId = new Map(
      seedFiles.map(({ cardId, blob }) => [cardId, blob]),
    );

    for (const card of seedCards) {
      const seedFile = seedFileByCardId.get(card.id);

      if (seedFile) {
        /*
         * The actual Blob is the source of truth for file metadata.
         * This avoids hard-coding a file size in seedData.ts and means the
         * UI always sees the real size of the fixture sitting in IndexedDB.
         */
        await tx.objectStore("cards").put({
          ...card,
          file_size: seedFile.size,
          mime_type: seedFile.type || card.mime_type,
        });

        /*
         * Cloud file data lives in Supabase Storage; guest file data lives
         * in IndexedDB's files store. Neither should ever hold base64.
         */
        await tx.objectStore("files").put(seedFile, card.id);
      } else {
        await tx.objectStore("cards").put(card);
      }
    }

    await tx.objectStore("_meta").put(true, "initialized");
  }

  const [boards, groups, cards] = await Promise.all([
    tx.objectStore("boards").getAll(),
    tx.objectStore("groups").getAll(),
    tx.objectStore("cards").getAll(),
  ]);

  await tx.done;

  return {
    boards,
    groups,
    cards,
  };
}

export async function clearGuestData(): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(
    ["_meta", "boards", "groups", "cards", "files"],
    "readwrite",
  );

  await Promise.all([
    tx.objectStore("_meta").clear(),
    tx.objectStore("boards").clear(),
    tx.objectStore("groups").clear(),
    tx.objectStore("cards").clear(),
    tx.objectStore("files").clear(),
  ]);

  await tx.done;
}

export async function putBoard(board: Board): Promise<void> {
  const db = await getDB();

  await db.put("boards", board);
}

export async function deleteBoardCascade(boardId: string): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(
    ["boards", "groups", "cards", "files"],
    "readwrite",
  );

  await tx.objectStore("boards").delete(boardId);

  const groupKeys = await tx
    .objectStore("groups")
    .index("by-board")
    .getAllKeys(boardId);

  for (const id of groupKeys) {
    await tx.objectStore("groups").delete(id);
  }

  const cardKeys = await tx
    .objectStore("cards")
    .index("by-board")
    .getAllKeys(boardId);

  for (const id of cardKeys) {
    await tx.objectStore("cards").delete(id);
    await tx.objectStore("files").delete(id);
  }

  await tx.done;
}

export async function putGroup(group: CardGroup): Promise<void> {
  const db = await getDB();

  await db.put("groups", group);
}

export async function deleteGroup(groupId: string): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(["groups", "cards"], "readwrite");

  await tx.objectStore("groups").delete(groupId);

  // A group is only organizational metadata. Deleting it must therefore
  // leave its cards alive and move them back to the ungrouped section.
  const cards = await tx.objectStore("cards").index("by-group").getAll(groupId);

  for (const card of cards) {
    await tx.objectStore("cards").put({
      ...card,
      group_id: null,
      updated_at: new Date().toISOString(),
    });
  }

  await tx.done;
}

export async function putCard(card: ClipCard): Promise<void> {
  const db = await getDB();

  await db.put("cards", card);
}

export async function putFile(cardId: string, blob: Blob): Promise<void> {
  const db = await getDB();

  await db.put("files", blob, cardId);
}

export async function getFile(cardId: string): Promise<Blob | undefined> {
  const db = await getDB();

  return db.get("files", cardId);
}

export async function deleteCard(cardId: string): Promise<void> {
  const db = await getDB();

  // The card and its Blob are separate IndexedDB records, so delete both
  // together. This prevents a deleted card from leaving its file behind.
  const tx = db.transaction(["cards", "files"], "readwrite");

  await tx.objectStore("cards").delete(cardId);
  await tx.objectStore("files").delete(cardId);

  await tx.done;
}

/**
 * Guest mode has no server-side cleanup job, so expired cards need a small
 * local equivalent. This only removes unpinned cards whose explicit
 * expires_at has passed. Pinned cards normally have expires_at = null.
 */
export async function deleteExpiredGuestCards(): Promise<void> {
  const db = await getDB();

  const cards = await db.getAll("cards");

  const now = Date.now();

  const expiredIds = cards
    .filter(
      (card) =>
        !card.pinned &&
        card.expires_at !== null &&
        new Date(card.expires_at).getTime() <= now,
    )
    .map((card) => card.id);

  if (expiredIds.length === 0) return;

  const tx = db.transaction(["cards", "files"], "readwrite");

  for (const id of expiredIds) {
    await tx.objectStore("cards").delete(id);
    await tx.objectStore("files").delete(id);
  }

  await tx.done;
}
