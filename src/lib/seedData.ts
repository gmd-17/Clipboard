import type { Board, CardGroup, ClipCard } from "../types";

const GUEST_USER_ID = "guest-local";

/**
 * Seed data is created when a fresh guest database is initialized.
 *
 * We use one base timestamp for the entire seed operation rather than
 * hard-coding a historical date. This keeps "created X ago" UI and expiry
 * testing meaningful whenever the demo data is created.
 */
const getSeedTimestamp = (baseTime: number, offsetMinutes = 0) =>
  new Date(baseTime + offsetMinutes * 60_000).toISOString();

export const SEED_FILE_FIXTURES = [
  {
    cardId: "seed-card-image",
    path: "/seed/clipboard-test-image.svg",
  },
  {
    cardId: "seed-card-pinned-image",
    path: "/seed/clipboard-test-pinned-image.png",
  },
  {
    cardId: "seed-card-pdf",
    path: "/seed/clipboard-test-pdf.pdf",
  },
  {
    cardId: "seed-card-docx",
    path: "/seed/clipboard-test-docx.docx",
  },
  {
    cardId: "seed-card-file",
    path: "/seed/clipboard-test-text.txt",
  },
] as const;

export function createSeedBoards(now = Date.now()): Board[] {
  const boardCreatedAt = getSeedTimestamp(now, -15);

  return [
    {
      id: "seed-board-work",
      user_id: GUEST_USER_ID,
      name: "Work",
      description: "Things I want to keep around while working.",
      icon: "💼",
      position: 0,
      ttl_hours: 48,
      is_default: false,
      created_at: boardCreatedAt,
      updated_at: boardCreatedAt,
    },
    {
      id: "seed-board-personal",
      user_id: GUEST_USER_ID,
      name: "Personal",
      description: "Personal snippets and files.",
      icon: "🏠",
      position: 1,
      ttl_hours: 168,
      is_default: true,
      created_at: boardCreatedAt,
      updated_at: boardCreatedAt,
    },
  ];
}

export function createSeedGroups(now = Date.now()): CardGroup[] {
  const groupCreatedAt = getSeedTimestamp(now, -15);

  return [
    {
      id: "seed-group-code",
      board_id: "seed-board-work",
      user_id: GUEST_USER_ID,
      name: "Code",
      color: "blue",
      position: 0,
      created_at: groupCreatedAt,
      updated_at: groupCreatedAt,
    },
    {
      id: "seed-group-links",
      board_id: "seed-board-work",
      user_id: GUEST_USER_ID,
      name: "Links",
      color: "purple",
      position: 1,
      created_at: groupCreatedAt,
      updated_at: groupCreatedAt,
    },
    {
      id: "seed-group-files",
      board_id: "seed-board-work",
      user_id: GUEST_USER_ID,
      name: "Files",
      color: "emerald",
      position: 2,
      created_at: groupCreatedAt,
      updated_at: groupCreatedAt,
    },
    {
      id: "seed-group-ideas",
      board_id: "seed-board-personal",
      user_id: GUEST_USER_ID,
      name: "Ideas",
      color: "amber",
      position: 0,
      created_at: groupCreatedAt,
      updated_at: groupCreatedAt,
    },
  ];
}

export function createSeedCards(now = Date.now()): ClipCard[] {
  return [
    // -----------------------------------------------------------------------
    // Work board
    // -----------------------------------------------------------------------

    {
      id: "seed-card-text",
      board_id: "seed-board-work",
      user_id: GUEST_USER_ID,
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
      created_at: getSeedTimestamp(now, -5),
      updated_at: getSeedTimestamp(now, -5),
    },

    {
      id: "seed-card-long-text",
      board_id: "seed-board-work",
      user_id: GUEST_USER_ID,
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
      created_at: getSeedTimestamp(now, -5),
      updated_at: getSeedTimestamp(now, -5),
    },

    {
      id: "seed-card-url",
      board_id: "seed-board-work",
      user_id: GUEST_USER_ID,
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
      created_at: getSeedTimestamp(now, -5),
      updated_at: getSeedTimestamp(now, -5),
    },

    {
      id: "seed-card-image",
      board_id: "seed-board-work",
      user_id: GUEST_USER_ID,
      group_id: "seed-group-files",
      note: "Test image stored as an IndexedDB Blob",
      pinned: false,
      tag: "emerald",
      type: "image",
      content: null,
      file_path: null,
      file_name: "clipboard-test-image.svg",
      file_size: null,
      mime_type: "image/svg+xml",
      ocr_text: "Clipboard Guest Mode Image Test",
      og_title: null,
      og_description: null,
      og_image: null,
      og_site_name: null,
      og_favicon: null,
      position: 3,
      expires_at: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
      created_at: getSeedTimestamp(now, -5),
      updated_at: getSeedTimestamp(now, -5),
    },

    {
      id: "seed-card-pinned-image",
      board_id: "seed-board-work",
      user_id: GUEST_USER_ID,
      group_id: "seed-group-files",
      note: "Pinned image — should never expire",
      pinned: true,
      tag: "rose",
      type: "image",
      content: null,
      file_path: null,
      file_name: "clipboard-test-pinned-image.png",
      file_size: null,
      mime_type: "image/png",
      ocr_text: "Pinned Clipboard Image",
      og_title: null,
      og_description: null,
      og_image: null,
      og_site_name: null,
      og_favicon: null,
      position: 4,
      expires_at: null,
      created_at: getSeedTimestamp(now, -5),
      updated_at: getSeedTimestamp(now, -5),
    },

    {
      id: "seed-card-pdf",
      board_id: "seed-board-work",
      user_id: GUEST_USER_ID,
      group_id: "seed-group-files",
      note: "Real PDF fixture for preview testing",
      pinned: false,
      tag: "red",
      type: "pdf",
      content: null,
      file_path: null,
      file_name: "clipboard-test-pdf.pdf",
      file_size: null,
      mime_type: "application/pdf",
      ocr_text: null,
      og_title: null,
      og_description: null,
      og_image: null,
      og_site_name: null,
      og_favicon: null,
      position: 5,
      expires_at: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
      created_at: getSeedTimestamp(now, -5),
      updated_at: getSeedTimestamp(now, -5),
    },

    {
      id: "seed-card-docx",
      board_id: "seed-board-work",
      user_id: GUEST_USER_ID,
      group_id: "seed-group-files",
      note: "Real DOCX fixture for file handling testing",
      pinned: false,
      tag: "blue",
      type: "docx",
      content: null,
      file_path: null,
      file_name: "clipboard-test-docx.docx",
      file_size: null,
      mime_type:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ocr_text: null,
      og_title: null,
      og_description: null,
      og_image: null,
      og_site_name: null,
      og_favicon: null,
      position: 6,
      expires_at: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
      created_at: getSeedTimestamp(now, -5),
      updated_at: getSeedTimestamp(now, -5),
    },

    {
      id: "seed-card-file",
      board_id: "seed-board-work",
      user_id: GUEST_USER_ID,
      group_id: "seed-group-files",
      note: "Generic file fixture for IndexedDB testing",
      pinned: false,
      tag: "amber",
      type: "file",
      content: null,
      file_path: null,
      file_name: "clipboard-test-text.txt",
      file_size: null,
      mime_type: "text/plain",
      ocr_text: null,
      og_title: null,
      og_description: null,
      og_image: null,
      og_site_name: null,
      og_favicon: null,
      position: 7,
      expires_at: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: getSeedTimestamp(now, -5),
      updated_at: getSeedTimestamp(now, -5),
    },

    {
      id: "seed-card-expired",
      board_id: "seed-board-work",
      user_id: GUEST_USER_ID,
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
      position: 8,
      expires_at: new Date(now - 60 * 60 * 1000).toISOString(),
      created_at: getSeedTimestamp(now, -5),
      updated_at: getSeedTimestamp(now, -5),
    },

    // -----------------------------------------------------------------------
    // Personal board
    // -----------------------------------------------------------------------

    {
      id: "seed-card-personal-welcome",
      board_id: "seed-board-personal",
      user_id: "guest-local",
      group_id: null,
      note: "A quick introduction to Clipboard",
      pinned: true,
      tag: "blue",
      type: "text",
      content: `Welcome to Clipboard!

This is your Personal board — a simple place to keep temporary snippets, links, notes, images, and files.

Boards let you keep different kinds of clipboard content separate.

Use the Boards tab at the top to switch between boards.

Want to see Clipboard's demo content? Open the Work board from the Boards tab. It contains examples of text, links, images, PDFs, DOCX files, and other file-backed cards.

Tip: The Personal board is intentionally kept simple so you can start using Clipboard without being overwhelmed by the demo content.`,
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
      expires_at: null,
      created_at: getSeedTimestamp(now, -5),
      updated_at: getSeedTimestamp(now, -5),
    },

    {
      id: "seed-card-markdown-code",
      board_id: "seed-board-work",
      user_id: "guest-local",
      group_id: "seed-group-code",
      note: "Markdown + Python syntax highlighting demo",
      pinned: false,
      tag: "blue",
      type: "text",
      content: `# Python example

A normal paragraph can contain **bold text** and \`inline code\`.

\`\`\`python
def greet(name):
    message = f"Hello, {name}!"
    print(message)

greet("Clipboard")
\`\`\`

And here's some JavaScript:

\`\`\`javascript
const cards = ["text", "image", "pdf"];

cards.forEach((card) => {
  console.log(card);
});
\`\`\`
`,
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
      expires_at: null,
      created_at: getSeedTimestamp(now, -5),
      updated_at: getSeedTimestamp(now, -5),
    },

    {
      id: "seed-card-personal",
      board_id: "seed-board-personal",
      user_id: GUEST_USER_ID,
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
      created_at: getSeedTimestamp(now, -5),
      updated_at: getSeedTimestamp(now, -5),
    },

    {
      id: "seed-card-pinned-text",
      board_id: "seed-board-personal",
      user_id: GUEST_USER_ID,
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
      created_at: getSeedTimestamp(now, -5),
      updated_at: getSeedTimestamp(now, -5),
    },
  ];
}

/**
 * Fetch the real static files used by the guest demo data.
 *
 * The files are served from /public/seed and converted to Blobs before
 * being stored in IndexedDB. This means the seed path exercises the same
 * Blob-based storage mechanism that real guest uploads use.
 */
export async function createSeedFiles(): Promise<
  Array<{
    cardId: string;
    blob: Blob;
  }>
> {
  return Promise.all(
    SEED_FILE_FIXTURES.map(async ({ cardId, path }) => {
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(
          `Failed to load guest seed file "${path}" (${response.status})`,
        );
      }

      return {
        cardId,
        blob: await response.blob(),
      };
    }),
  );
}
