import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Board, CardGroup, ClipCard } from "../../types";
import { SEED_BOARDS, SEED_GROUPS, SEED_CARDS } from "../seedData";

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
}

const DB_NAME = "clipboard-guest";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ClipboardDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ClipboardDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
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

  const initialized = await db.get("_meta", "initialized");

  if (!initialized) {
    await seedGuestData();

    return {
      boards: SEED_BOARDS,
      groups: SEED_GROUPS,
      cards: SEED_CARDS,
    };
  }

  return {
    boards: await db.getAll("boards"),
    groups: await db.getAll("groups"),
    cards: await db.getAll("cards"),
  };
}

export async function seedGuestData(): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(
    ["_meta", "boards", "groups", "cards"],
    "readwrite",
  );

  for (const board of SEED_BOARDS) {
    await tx.objectStore("boards").put(board);
  }

  for (const group of SEED_GROUPS) {
    await tx.objectStore("groups").put(group);
  }

  for (const card of SEED_CARDS) {
    await tx.objectStore("cards").put(card);
  }

  // Mark as initialized only after all seed data has been written.
  await tx.objectStore("_meta").put(true, "initialized");

  await tx.done;
}

export async function clearGuestData(): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(
    ["_meta", "boards", "groups", "cards"],
    "readwrite",
  );

  await Promise.all([
    tx.objectStore("_meta").clear(),
    tx.objectStore("boards").clear(),
    tx.objectStore("groups").clear(),
    tx.objectStore("cards").clear(),
  ]);

  await tx.done;
}
