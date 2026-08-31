import type { Board, CardGroup, ClipCard } from "../types";

export const SEED_BOARDS: Board[] = [
  {
    id: "seed-board-work",
    user_id: "guest-local",
    name: "Work",
    description: "Things I want to keep around while working.",
    icon: "💼",
    position: 0,
    ttl_hours: 48,
    is_default: true,
    created_at: "2026-08-31T08:00:00.000Z",
    updated_at: "2026-08-31T08:00:00.000Z",
  },
  {
    id: "seed-board-personal",
    user_id: "guest-local",
    name: "Personal",
    description: "Personal snippets and files.",
    icon: "🏠",
    position: 1,
    ttl_hours: 168,
    is_default: false,
    created_at: "2026-08-31T08:01:00.000Z",
    updated_at: "2026-08-31T08:01:00.000Z",
  },
];

export const SEED_GROUPS: CardGroup[] = [
  {
    id: "seed-group-code",
    board_id: "seed-board-work",
    user_id: "guest-local",
    name: "Code",
    color: "blue",
    position: 0,
    created_at: "2026-08-31T08:02:00.000Z",
    updated_at: "2026-08-31T08:02:00.000Z",
  },
  {
    id: "seed-group-links",
    board_id: "seed-board-work",
    user_id: "guest-local",
    name: "Links",
    color: "purple",
    position: 1,
    created_at: "2026-08-31T08:03:00.000Z",
    updated_at: "2026-08-31T08:03:00.000Z",
  },
  {
    id: "seed-group-files",
    board_id: "seed-board-work",
    user_id: "guest-local",
    name: "Files",
    color: "emerald",
    position: 2,
    created_at: "2026-08-31T08:04:00.000Z",
    updated_at: "2026-08-31T08:04:00.000Z",
  },
  {
    id: "seed-group-ideas",
    board_id: "seed-board-personal",
    user_id: "guest-local",
    name: "Ideas",
    color: "amber",
    position: 0,
    created_at: "2026-08-31T08:05:00.000Z",
    updated_at: "2026-08-31T08:05:00.000Z",
  },
];

/*
 * Keep the fixture Blobs in one place so their metadata cannot drift away
 * from the actual binary data we store in IndexedDB.
 */
const SEED_IMAGE_BLOB = new Blob(
  [
    `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#14b8a6"/>
          </linearGradient>
        </defs>

        <rect width="1200" height="700" fill="url(#bg)" />

        <circle cx="980" cy="130" r="110" fill="#ffffff" opacity="0.15"/>
        <circle cx="180" cy="570" r="180" fill="#ffffff" opacity="0.10"/>

        <text
          x="600"
          y="300"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="72"
          font-weight="bold"
          fill="white"
        >
          Clipboard
        </text>

        <text
          x="600"
          y="390"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="36"
          fill="white"
        >
          Guest Mode Image Test
        </text>

        <text
          x="600"
          y="460"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="24"
          fill="white"
          opacity="0.85"
        >
          IndexedDB → Blob → Object URL
        </text>
      </svg>
    `,
  ],
  {
    type: "image/svg+xml",
  },
);

const SEED_PINNED_IMAGE_BLOB = new Blob(
  [
    `
      <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600">
        <rect width="1000" height="600" rx="40" fill="#18181b"/>

        <rect
          x="30"
          y="30"
          width="940"
          height="540"
          rx="30"
          fill="#27272a"
          stroke="#f43f5e"
          stroke-width="8"
        />

        <text
          x="500"
          y="270"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="64"
          font-weight="bold"
          fill="#fda4af"
        >
          📌 PINNED
        </text>

        <text
          x="500"
          y="350"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="32"
          fill="white"
        >
          This image never expires
        </text>
      </svg>
    `,
  ],
  {
    type: "image/svg+xml",
  },
);

const SEED_TEXT_FILE_BLOB = new Blob(
  [
    `Clipboard guest-mode file test

This is a real Blob stored in IndexedDB.

Card: seed-card-file
Purpose: verify that binary/file data survives persistence.

No base64 is involved.
`,
  ],
  {
    type: "text/plain",
  },
);

const now = Date.now();

export const SEED_CARDS: ClipCard[] = [
  {
    id: "seed-card-text",
    board_id: "seed-board-work",
    user_id: "guest-local",
    group_id: "seed-group-code",
    note: "Basic text card",
    pinned: false,
    tag: "blue",
    type: "text",
    content:
      "This is a normal text card. Use it to test multiline content, card sizing, and the basic card UI.",
    file_path: null,
    file_name: null,
    file_size: null,
    mime_type: null,
    ocr_text: null,
    og_title: null,
    og_description: null,
    og_image: null,
    og_site_name: null,
    og_favicon: null,
    position: 0,
    expires_at: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
    created_at: "2026-08-31T08:10:00.000Z",
    updated_at: "2026-08-31T08:10:00.000Z",
  },

  {
    id: "seed-card-long-text",
    board_id: "seed-board-work",
    user_id: "guest-local",
    group_id: "seed-group-code",
    note: "Long content",
    pinned: false,
    tag: "none",
    type: "text",
    content:
      "const clipboard = await navigator.clipboard.readText();\n\nconsole.log(clipboard);\n\n// Try pasting a few paragraphs here to see how the card behaves with longer content.",
    file_path: null,
    file_name: null,
    file_size: null,
    mime_type: null,
    ocr_text: null,
    og_title: null,
    og_description: null,
    og_image: null,
    og_site_name: null,
    og_favicon: null,
    position: 1,
    expires_at: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    created_at: "2026-08-31T08:11:00.000Z",
    updated_at: "2026-08-31T08:11:00.000Z",
  },

  {
    id: "seed-card-url",
    board_id: "seed-board-work",
    user_id: "guest-local",
    group_id: "seed-group-links",
    note: "URL card",
    pinned: false,
    tag: "purple",
    type: "url",
    content: "https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API",
    file_path: null,
    file_name: null,
    file_size: null,
    mime_type: null,
    ocr_text: null,
    og_title: "Clipboard API",
    og_description:
      "The Clipboard API provides read and write access to the system clipboard.",
    og_image: null,
    og_site_name: "MDN Web Docs",
    og_favicon: null,
    position: 2,
    expires_at: new Date(now + 72 * 60 * 60 * 1000).toISOString(),
    created_at: "2026-08-31T08:12:00.000Z",
    updated_at: "2026-08-31T08:12:00.000Z",
  },

  {
    id: "seed-card-image",
    board_id: "seed-board-work",
    user_id: "guest-local",
    group_id: "seed-group-files",
    note: "Test image stored as an IndexedDB Blob",
    pinned: false,
    tag: "emerald",
    type: "image",
    content: null,
    file_path: null,
    file_name: "clipboard-test-image.svg",
    file_size: SEED_IMAGE_BLOB.size,
    mime_type: SEED_IMAGE_BLOB.type,
    ocr_text: "Clipboard Guest Mode Image Test",
    og_title: null,
    og_description: null,
    og_image: null,
    og_site_name: null,
    og_favicon: null,
    position: 3,
    expires_at: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
    created_at: "2026-08-31T08:13:00.000Z",
    updated_at: "2026-08-31T08:13:00.000Z",
  },

  {
    id: "seed-card-pinned-image",
    board_id: "seed-board-work",
    user_id: "guest-local",
    group_id: "seed-group-files",
    note: "Pinned image — should never expire",
    pinned: true,
    tag: "rose",
    type: "image",
    content: null,
    file_path: null,
    file_name: "clipboard-pinned-image.svg",
    file_size: SEED_PINNED_IMAGE_BLOB.size,
    mime_type: SEED_PINNED_IMAGE_BLOB.type,
    ocr_text: "Pinned Clipboard Image",
    og_title: null,
    og_description: null,
    og_image: null,
    og_site_name: null,
    og_favicon: null,
    position: 4,
    expires_at: null,
    created_at: "2026-08-31T08:14:00.000Z",
    updated_at: "2026-08-31T08:14:00.000Z",
  },

  {
    id: "seed-card-file",
    board_id: "seed-board-work",
    user_id: "guest-local",
    group_id: "seed-group-files",
    note: "Small file Blob for IndexedDB testing",
    pinned: false,
    tag: "amber",
    type: "file",
    content: null,
    file_path: null,
    file_name: "clipboard-test.txt",
    file_size: SEED_TEXT_FILE_BLOB.size,
    mime_type: SEED_TEXT_FILE_BLOB.type,
    ocr_text: null,
    og_title: null,
    og_description: null,
    og_image: null,
    og_site_name: null,
    og_favicon: null,
    position: 5,
    expires_at: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: "2026-08-31T08:15:00.000Z",
    updated_at: "2026-08-31T08:15:00.000Z",
  },

  {
    id: "seed-card-expired",
    board_id: "seed-board-work",
    user_id: "guest-local",
    group_id: "seed-group-code",
    note: "This card is intentionally expired and should disappear after cleanup.",
    pinned: false,
    tag: "red",
    type: "text",
    content: "You should not see this after guest cleanup runs.",
    file_path: null,
    file_name: null,
    file_size: null,
    mime_type: null,
    ocr_text: null,
    og_title: null,
    og_description: null,
    og_image: null,
    og_site_name: null,
    og_favicon: null,
    position: 6,
    expires_at: new Date(now - 60 * 60 * 1000).toISOString(),
    created_at: "2026-08-30T08:00:00.000Z",
    updated_at: "2026-08-30T08:00:00.000Z",
  },

  {
    id: "seed-card-personal",
    board_id: "seed-board-personal",
    user_id: "guest-local",
    group_id: "seed-group-ideas",
    note: "Personal idea",
    pinned: false,
    tag: "amber",
    type: "text",
    content:
      "Build a really good offline-first clipboard experience with fast search.",
    file_path: null,
    file_name: null,
    file_size: null,
    mime_type: null,
    ocr_text: null,
    og_title: null,
    og_description: null,
    og_image: null,
    og_site_name: null,
    og_favicon: null,
    position: 0,
    expires_at: new Date(now + 168 * 60 * 60 * 1000).toISOString(),
    created_at: "2026-08-31T08:20:00.000Z",
    updated_at: "2026-08-31T08:20:00.000Z",
  },

  {
    id: "seed-card-pinned-text",
    board_id: "seed-board-personal",
    user_id: "guest-local",
    group_id: "seed-group-ideas",
    note: "Pinned note",
    pinned: true,
    tag: "blue",
    type: "text",
    content: "This should remain visible indefinitely.",
    file_path: null,
    file_name: null,
    file_size: null,
    mime_type: null,
    ocr_text: null,
    og_title: null,
    og_description: null,
    og_image: null,
    og_site_name: null,
    og_favicon: null,
    position: 1,
    expires_at: null,
    created_at: "2026-08-31T08:21:00.000Z",
    updated_at: "2026-08-31T08:21:00.000Z",
  },
];

/**
 * Return the exact Blob instances represented by the file-backed seed cards.
 *
 * The card's file_size and mime_type are derived from these same Blobs above,
 * so the metadata and the actual stored binary data cannot disagree.
 */
export function createSeedFiles(): Array<{
  cardId: string;
  blob: Blob;
}> {
  return [
    {
      cardId: "seed-card-image",
      blob: SEED_IMAGE_BLOB,
    },
    {
      cardId: "seed-card-pinned-image",
      blob: SEED_PINNED_IMAGE_BLOB,
    },
    {
      cardId: "seed-card-file",
      blob: SEED_TEXT_FILE_BLOB,
    },
  ];
}
