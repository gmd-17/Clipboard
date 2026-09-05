import { useEffect, useRef, useState } from "react";
import {
  CheckIcon,
  FileIcon,
  PinIcon,
  PlusIcon,
  TypeIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";

import type { ItemType, TagColor } from "../../types";
import type { CreateCardInput } from "../../lib/api/cards";

import { useData } from "../../context/DataContext";
import { EXPIRY_OPTIONS, tagColorMap } from "../../utils/boardCardUtils";

interface AddCardModalProps {
  boardId: string;
  onClose: () => void;
}

const TAG_OPTIONS: TagColor[] = [
  "none",
  "red",
  "amber",
  "emerald",
  "blue",
  "purple",
  "rose",
];

const AddCardModal = ({ boardId, onClose }: AddCardModalProps) => {
  const { createCard, cards, isGuest } = useData();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"text" | "file">("text");
  const [content, setContent] = useState("");
  const [note, setNote] = useState("");
  const [tag, setTag] = useState<TagColor>("none");
  const [expiryHours, setExpiryHours] = useState(
    EXPIRY_OPTIONS[0]?.hours ?? 24,
  );
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];

    if (!selected) {
      return;
    }

    console.log("[AddCardModal] File selected:", {
      name: selected.name,
      type: selected.type,
      size: selected.size,
    });

    setFile(selected);
  };

  const detectType = (value: string): ItemType => {
    try {
      new URL(value.trim());
      return "url";
    } catch {
      return "text";
    }
  };

  const handleSubmit = async () => {
    console.log("[AddCardModal] Submit started");

    console.log("[AddCardModal] Current state:", {
      boardId,
      mode,
      content,
      note,
      tag,
      expiryHours,
      file,
      isGuest,
    });

    // Validate text input
    if (mode === "text" && !content.trim()) {
      console.warn("[AddCardModal] Cannot create card: content is empty");
      return;
    }

    // Validate file input
    if (mode === "file" && !file) {
      console.warn("[AddCardModal] No file selected. Opening file picker.");

      fileInputRef.current?.click();
      return;
    }

    setSaving(true);

    try {
      /*
       * Determine card type.
       */
      const type: ItemType =
        mode === "file"
          ? file?.type === "application/pdf"
            ? "pdf"
            : file?.type.startsWith("image/")
              ? "image"
              : "file"
          : detectType(content);

      /*
       * New cards should be placed after the existing cards
       * belonging to this board.
       */
      const boardCards = cards.filter((card) => card.board_id === boardId);

      const position =
        boardCards.length > 0
          ? Math.max(...boardCards.map((card) => card.position)) + 1
          : 0;

      console.log("[AddCardModal] Calculated card information:", {
        type,
        position,
        boardCardCount: boardCards.length,
      });

      /*
       * CreateCardInput intentionally does NOT contain an ID.
       *
       * The API layer generates the ID:
       *
       * guest:
       *   crypto.randomUUID()
       *
       * cloud:
       *   Supabase-generated ID
       */
      const payload: CreateCardInput = {
        board_id: boardId,

        content: mode === "text" ? content.trim() : null,

        note: note.trim() ? note.trim() : null,

        type,

        tag,

        pinned: expiryHours === 0,

        expires_at:
          expiryHours === 0
            ? null
            : new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),

        position,

        group_id: null,

        file_name: file?.name ?? null,

        file_path: null,

        file_size: file?.size ?? null,

        mime_type: file?.type ?? null,

        ocr_text: null,

        og_title: null,

        og_description: null,

        og_image: null,

        og_site_name: null,

        og_favicon: null,

        /*
         * File can be File because File extends Blob.
         *
         * However, CreateCardInput expects:
         *
         * Blob | undefined
         *
         * so null needs to become undefined.
         */
        file: mode === "file" ? (file ?? undefined) : undefined,
      };

      console.log("[AddCardModal] Payload being sent to createCard():", {
        ...payload,

        // Don't dump the complete binary file into the console.
        file: payload.file
          ? {
              name: file?.name,
              type: file?.type,
              size: file?.size,
            }
          : undefined,
      });

      console.log("[AddCardModal] Calling createCard()...", {
        isGuest,
        boardId,
      });

      /*
       * IMPORTANT:
       *
       * createCard() returns the actual ClipCard.
       *
       * In guest mode the API creates:
       *
       * id: crypto.randomUUID()
       *
       * before saving it to IndexedDB.
       */
      const created = await createCard(payload);

      console.log("[AddCardModal] createCard() returned:", created);

      console.log("[AddCardModal] Created card ID:", created.id);

      console.log("[AddCardModal] Created card board ID:", created.board_id);

      console.log("[AddCardModal] Created card type:", created.type);

      console.log("[AddCardModal] Created card position:", created.position);

      /*
       * This is the most important debug check.
       */
      if (!created.id) {
        console.error(
          "[AddCardModal] ERROR: createCard() returned a card WITHOUT an ID!",
          created,
        );
      } else {
        console.log("[AddCardModal] SUCCESS: Created card has ID:", created.id);
      }

      /*
       * The DataContext has already added `created` to its cards state
       * inside handleCreateCard().
       */
      console.log("[AddCardModal] createCard() completed successfully.");

      onClose();
    } catch (error) {
      console.error("[AddCardModal] Failed to create card:", error);
    } finally {
      setSaving(false);

      console.log("[AddCardModal] Submit finished.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-card-title"
        className="bg-secondary border-border-subtle w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="border-border-subtle flex items-center gap-3 border-b px-5 py-4">
          <div className="bg-surface text-text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
            <PlusIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h2
              id="add-card-title"
              className="text-text-primary text-sm font-semibold"
            >
              Add to Clipboard
            </h2>

            <p className="text-text-muted mt-0.5 text-xs">
              Create a note, paste a URL, or attach files
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:bg-surface-hover hover:text-text-primary ml-auto cursor-pointer rounded-lg p-1.5 transition-colors"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-border-subtle flex border-b px-5">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`relative flex items-center gap-2 px-1 py-3 text-xs font-semibold transition-colors ${
              mode === "text"
                ? "text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <TypeIcon className="h-4 w-4" />
            Text / URL Link
            {mode === "text" && (
              <span className="bg-accent absolute right-0 bottom-0 left-0 h-0.5 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMode("file")}
            className={`relative ml-6 flex items-center gap-2 px-1 py-3 text-xs font-semibold transition-colors ${
              mode === "file"
                ? "text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <UploadIcon className="h-4 w-4" />
            Upload File(s)
            {mode === "file" && (
              <span className="bg-accent absolute right-0 bottom-0 left-0 h-0.5 rounded-full" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 p-5">
          {mode === "text" ? (
            <div className="space-y-2">
              <label
                htmlFor="add-card-content"
                className="text-text-secondary text-xs font-medium"
              >
                Content
              </label>

              <textarea
                id="add-card-content"
                autoFocus
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Paste text, code snippets, or a URL..."
                className="border-border-subtle bg-primary text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-border-focus/10 min-h-28 w-full resize-y rounded-xl border px-3.5 py-3 font-mono text-xs transition-all outline-none focus:ring-4"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-text-secondary text-xs font-medium">
                File
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border-border-subtle bg-primary hover:bg-surface-hover flex min-h-28 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 transition-colors"
              >
                {file ? (
                  <>
                    <FileIcon className="text-text-secondary mb-2 h-6 w-6" />

                    <span className="text-text-primary max-w-full truncate text-xs font-medium">
                      {file.name}
                    </span>

                    <span className="text-text-muted mt-1 text-[11px]">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </>
                ) : (
                  <>
                    <UploadIcon className="text-text-muted mb-2 h-6 w-6" />

                    <span className="text-text-secondary text-xs font-medium">
                      Choose a file
                    </span>

                    <span className="text-text-muted mt-1 text-[11px]">
                      Images, PDFs and other files
                    </span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Note */}
          <div className="space-y-2">
            <label
              htmlFor="add-card-note"
              className="text-text-secondary text-xs font-medium"
            >
              Optional Note / Caption
            </label>

            <input
              id="add-card-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Design inspiration for project..."
              className="border-border-subtle bg-primary text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-border-focus/10 h-9 w-full rounded-xl border px-3 text-xs transition-all outline-none focus:ring-4"
            />
          </div>

          {/* Pin + Tags */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() =>
                setExpiryHours((current) => (current === 0 ? 24 : 0))
              }
              className="text-text-secondary flex cursor-pointer items-center gap-2 text-xs font-medium"
            >
              <span
                className={`border-border-subtle flex h-4 w-4 items-center justify-center rounded border ${
                  expiryHours === 0 ? "bg-accent border-accent" : "bg-primary"
                }`}
              >
                {expiryHours === 0 && (
                  <CheckIcon className="text-accent-foreground h-3 w-3" />
                )}
              </span>
              <PinIcon className="h-3.5 w-3.5" />
              Pin card (never expires)
            </button>

            <div className="flex items-center gap-2">
              {TAG_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  title={option}
                  aria-label={`Set tag to ${option}`}
                  onClick={() => setTag(option)}
                  className={`h-5 w-5 cursor-pointer rounded-full border-2 transition-transform ${
                    tag === option
                      ? "border-text-primary scale-110"
                      : "border-transparent"
                  } ${
                    option === "none" ? "bg-surface-hover" : tagColorMap[option]
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Expiry */}
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-[11px]">Expires:</span>

            <div className="flex flex-wrap gap-1.5">
              {EXPIRY_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setExpiryHours(option.hours)}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    expiryHours === option.hours
                      ? "bg-accent text-accent-foreground border-accent"
                      : "border-border-subtle bg-primary text-text-secondary hover:bg-surface-hover"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-border-subtle flex items-center justify-end gap-2 border-t px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:bg-surface-hover cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              saving ||
              (mode === "text" && !content.trim()) ||
              (mode === "file" && !file)
            }
            onClick={handleSubmit}
            className="bg-accent text-accent-foreground flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}

            {saving ? "Adding..." : "Add to Board"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCardModal;
