import type { Board, CardGroup, ClipCard } from "../types";

// Guest mode has no real auth.users row.
// This ID is only used by the local IndexedDB seed and must never be
// sent to Supabase as an authenticated user's ID.
export const GUEST_USER_ID = "guest-local";

const now = () => new Date().toISOString();

const hoursFromNow = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

export const SEED_BOARDS: Board[] = [
  {
    id: "board-main",
    user_id: GUEST_USER_ID,
    name: "Main",
    description: "Quick snippets, links, and ideas",
    icon: null,
    position: 0,
    ttl_hours: 48,
    is_default: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "board-work",
    user_id: GUEST_USER_ID,
    name: "Work & Code",
    description: "Snippets, documentation, and references",
    icon: null,
    position: 1,
    ttl_hours: 24,
    is_default: false,
    created_at: now(),
    updated_at: now(),
  },
];

export const SEED_GROUPS: CardGroup[] = [
  {
    id: "group-main-notes",
    board_id: "board-main",
    user_id: GUEST_USER_ID,
    name: "Notes",
    color: "amber",
    position: 0,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "group-main-links",
    board_id: "board-main",
    user_id: GUEST_USER_ID,
    name: "Links",
    color: "emerald",
    position: 1,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "group-work-code",
    board_id: "board-work",
    user_id: GUEST_USER_ID,
    name: "Code",
    color: "purple",
    position: 0,
    created_at: now(),
    updated_at: now(),
  },
];

export const SEED_CARDS: ClipCard[] = [
  // ---------------------------------------------------------------------------
  // Main board
  // ---------------------------------------------------------------------------

  {
    id: "clip-welcome",
    board_id: "board-main",
    user_id: GUEST_USER_ID,

    type: "text",
    content:
      "Press Ctrl+V / Cmd+V anywhere to paste text, links, or files.\n" +
      "Drag & drop files onto the page to add them.\n" +
      "Cards auto-expire unless pinned — click the clock badge to change that.",

    note: "Welcome to Clipboard 👋",
    pinned: true,
    tag: "blue",

    group_id: null,

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
    created_at: now(),
    updated_at: now(),
  },

  {
    id: "clip-note-1",
    board_id: "board-main",
    user_id: GUEST_USER_ID,

    type: "text",
    content:
      "Follow up with design team about the new onboarding flow. " +
      "Ask about timeline.",

    note: "Meeting notes draft",
    pinned: false,
    tag: "amber",

    group_id: "group-main-notes",

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
    expires_at: hoursFromNow(24),
    created_at: now(),
    updated_at: now(),
  },

  {
    id: "clip-link-1",
    board_id: "board-main",
    user_id: GUEST_USER_ID,

    type: "url",
    content: "https://supabase.com",

    note: null,
    pinned: false,
    tag: "emerald",

    group_id: "group-main-links",

    file_path: null,
    file_name: null,
    file_size: null,
    mime_type: null,

    ocr_text: null,

    // Pre-filled Open Graph data so the demo card can render
    // without making a live metadata request.
    og_title: "Supabase | The Open Source Firebase Alternative",
    og_description:
      "Build in a weekend, scale to millions. Postgres database, " +
      "Authentication, instant APIs, Realtime subscriptions, and Storage.",
    og_image: null,
    og_site_name: "supabase.com",
    og_favicon: "https://supabase.com/favicon/favicon.ico",

    position: 2,
    expires_at: hoursFromNow(48),
    created_at: now(),
    updated_at: now(),
  },

  // ---------------------------------------------------------------------------
  // Work & Code board
  // ---------------------------------------------------------------------------

  {
    id: "clip-code-1",
    board_id: "board-work",
    user_id: GUEST_USER_ID,

    type: "text",
    content:
      "function debounce(fn, delay) {\n" +
      "  let timer;\n" +
      "  return (...args) => {\n" +
      "    clearTimeout(timer);\n" +
      "    timer = setTimeout(() => fn(...args), delay);\n" +
      "  };\n" +
      "}",

    note: "Snippet: debounce helper",
    pinned: false,
    tag: "purple",

    group_id: "group-work-code",

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
    expires_at: hoursFromNow(24),
    created_at: now(),
    updated_at: now(),
  },

  {
    id: "clip-code-2",
    board_id: "board-work",
    user_id: GUEST_USER_ID,

    type: "text",
    content:
      "const { data, error } = await supabase\n" +
      "  .from('clips')\n" +
      "  .select('*')\n" +
      "  .eq('board_id', boardId)\n" +
      "  .order('position');",

    note: "Supabase query pattern",
    pinned: false,
    tag: "blue",

    group_id: "group-work-code",

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
    expires_at: hoursFromNow(24),
    created_at: now(),
    updated_at: now(),
  },
];
