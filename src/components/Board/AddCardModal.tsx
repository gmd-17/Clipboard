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

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  /*
   * Close modal with Escape.
   */
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

  /*
   * Add incoming files to the current file list.
   *
   * Duplicate files are ignored based on:
   * - name
   * - size
   * - lastModified
   */
  const handleFiles = (incomingFiles: FileList | File[]) => {
    const selectedFiles = Array.from(incomingFiles);

    if (!selectedFiles.length) {
      return;
    }

    const newFiles = selectedFiles.filter(
      (incomingFile) =>
        !files.some(
          (existingFile) =>
            existingFile.name === incomingFile.name &&
            existingFile.size === incomingFile.size &&
            existingFile.lastModified === incomingFile.lastModified,
        ),
    );

    if (!newFiles.length) {
      console.log("[AddCardModal] All selected files are already added.");

      return;
    }

    console.log(
      "[AddCardModal] Files selected:",
      newFiles.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    );

    setFiles((current) => [...current, ...newFiles]);
  };

  /*
   * File picker.
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFiles(event.target.files);
    }

    /*
     * Reset the input so selecting the same file again
     * still triggers onChange.
     */
    event.target.value = "";
  };

  /*
   * Remove a single selected file.
   */
  const handleRemoveFile = (index: number) => {
    const removedFile = files[index];

    console.log("[AddCardModal] Removing file:", removedFile?.name);

    setFiles((current) =>
      current.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  /*
   * Drag enter.
   */
  const handleDragEnter = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(true);
  };

  /*
   * Drag over.
   */
  const handleDragOver = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    event.dataTransfer.dropEffect = "copy";

    setIsDragging(true);
  };

  /*
   * Drag leave.
   */
  const handleDragLeave = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);
  };

  /*
   * Drop files.
   */
  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    const droppedFiles = event.dataTransfer.files;

    if (!droppedFiles.length) {
      return;
    }

    console.log(
      "[AddCardModal] Files dropped:",
      Array.from(droppedFiles).map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    );

    handleFiles(droppedFiles);
  };

  /*
   * Determine whether text content is a URL.
   */
  const detectType = (value: string): ItemType => {
    try {
      new URL(value.trim());
      return "url";
    } catch {
      return "text";
    }
  };

  /*
   * Determine the ClipCard type for a file.
   */
  const getFileType = (file: File): ItemType => {
    if (file.type === "application/pdf") {
      return "pdf";
    }

    if (file.type.startsWith("image/")) {
      return "image";
    }

    return "file";
  };

  /*
   * Calculate the next position for a card.
   */
  const getNextPosition = () => {
    const boardCards = cards.filter((card) => card.board_id === boardId);

    if (!boardCards.length) {
      return 0;
    }

    return Math.max(...boardCards.map((card) => card.position)) + 1;
  };

  /*
   * Create a text/URL card.
   */
  const createTextCard = async (position: number) => {
    const type = detectType(content);

    const payload: CreateCardInput = {
      board_id: boardId,

      content: content.trim(),

      note: note.trim() || null,

      type,

      tag,

      pinned: expiryHours === 0,

      expires_at:
        expiryHours === 0
          ? null
          : new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),

      position,

      group_id: null,

      file_name: null,
      file_path: null,
      file_size: null,
      mime_type: null,

      ocr_text: null,

      og_title: null,
      og_description: null,
      og_image: null,
      og_site_name: null,
      og_favicon: null,

      file: undefined,
    };

    console.log("[AddCardModal] Creating text card:", payload);

    const created = await createCard(payload);

    console.log("[AddCardModal] Text card created:", created);

    console.log("[AddCardModal] Text card ID:", created.id);

    if (!created.id) {
      console.error(
        "[AddCardModal] ERROR: Text card was created without an ID!",
        created,
      );
    }

    return created;
  };

  /*
   * Create one card for one file.
   */
  const createFileCard = async (file: File, position: number) => {
    const type = getFileType(file);

    const payload: CreateCardInput = {
      board_id: boardId,

      content: null,

      note: note.trim() || null,

      type,

      tag,

      pinned: expiryHours === 0,

      expires_at:
        expiryHours === 0
          ? null
          : new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),

      position,

      group_id: null,

      file_name: file.name,

      file_path: null,

      file_size: file.size,

      mime_type: file.type || null,

      ocr_text: null,

      og_title: null,
      og_description: null,
      og_image: null,
      og_site_name: null,
      og_favicon: null,

      /*
       * File extends Blob, so this is valid.
       */
      file,
    };

    console.log("[AddCardModal] Creating file card:", {
      ...payload,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
      },
    });

    const created = await createCard(payload);

    console.log("[AddCardModal] File card created:", created);

    console.log("[AddCardModal] File card ID:", created.id);

    if (!created.id) {
      console.error(
        "[AddCardModal] ERROR: File card was created without an ID!",
        created,
      );
    }

    return created;
  };

  /*
   * Main submit handler.
   */
  const handleSubmit = async () => {
    console.log("[AddCardModal] ===========================");

    console.log("[AddCardModal] Submit started");

    console.log("[AddCardModal] Current state:", {
      boardId,
      mode,
      content,
      note,
      tag,
      expiryHours,
      files,
      fileCount: files.length,
      isGuest,
    });

    /*
     * Validate text mode.
     */
    if (mode === "text" && !content.trim()) {
      console.warn("[AddCardModal] Cannot create text card: content is empty.");

      return;
    }

    /*
     * Validate file mode.
     */
    if (mode === "file" && !files.length) {
      console.warn("[AddCardModal] No files selected. Opening file picker.");

      fileInputRef.current?.click();

      return;
    }

    setSaving(true);

    try {
      /*
       * Get the starting position.
       *
       * Each additional file will increment this.
       */
      let nextPosition = getNextPosition();

      console.log("[AddCardModal] Starting position:", nextPosition);

      /*
       * TEXT / URL
       *
       * One input = one card.
       */
      if (mode === "text") {
        const created = await createTextCard(nextPosition);

        console.log("[AddCardModal] Final created text card:", created);

        console.log("[AddCardModal] Final created text card ID:", created.id);
      }

      /*
       * FILES
       *
       * Every file becomes its own card.
       */
      if (mode === "file") {
        console.log(`[AddCardModal] Creating ${files.length} file card(s)...`);

        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];

          if (!file) {
            continue;
          }

          console.log(
            `[AddCardModal] Creating file ${index + 1}/${files.length}:`,
            {
              name: file.name,
              type: file.type,
              size: file.size,
              position: nextPosition,
            },
          );

          const created = await createFileCard(file, nextPosition);

          console.log(
            `[AddCardModal] File ${index + 1}/${files.length} created with ID:`,
            created.id,
          );

          /*
           * The next file gets the next position.
           */
          nextPosition += 1;
        }

        console.log("[AddCardModal] All file cards created successfully.");
      }

      console.log("[AddCardModal] Creation completed successfully.");

      onClose();
    } catch (error) {
      console.error("[AddCardModal] Failed to create card(s):", error);
    } finally {
      setSaving(false);

      console.log("[AddCardModal] Submit finished.");

      console.log("[AddCardModal] ===========================");
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
            Upload Files
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
            <div className="space-y-3">
              <label className="text-text-secondary text-xs font-medium">
                Files
              </label>

              {/* Drop zone */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex min-h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 transition-all ${
                  isDragging
                    ? "border-accent bg-accent/10"
                    : "border-border-subtle bg-primary hover:bg-surface-hover"
                }`}
              >
                {isDragging ? (
                  <>
                    <UploadIcon className="text-accent mb-2 h-7 w-7" />

                    <span className="text-text-primary text-xs font-semibold">
                      Drop files here
                    </span>

                    <span className="text-text-muted mt-1 text-[11px]">
                      Release to add them
                    </span>
                  </>
                ) : (
                  <>
                    <UploadIcon className="text-text-muted mb-2 h-6 w-6" />

                    <span className="text-text-secondary text-xs font-medium">
                      Drop files here or click to browse
                    </span>

                    <span className="text-text-muted mt-1 text-[11px]">
                      Each file will become its own card
                    </span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Selected files */}
              {files.length > 0 && (
                <div className="space-y-1.5">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                      className="bg-primary border-border-subtle flex items-center gap-3 rounded-lg border px-3 py-2"
                    >
                      <div className="bg-surface flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                        <FileIcon className="text-text-secondary h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-text-primary truncate text-xs font-medium">
                          {file.name}
                        </p>

                        <p className="text-text-muted mt-0.5 text-[10px]">
                          {(file.size / 1024).toFixed(1)} KB
                          {file.type ? ` · ${file.type}` : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-text-muted hover:bg-surface-hover hover:text-text-primary shrink-0 cursor-pointer rounded-md p-1.5 transition-colors"
                        aria-label={`Remove ${file.name}`}
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="text-text-muted flex items-center justify-between px-1 pt-1 text-[10px]">
                    <span>
                      {files.length} {files.length === 1 ? "file" : "files"}{" "}
                      selected
                    </span>

                    <button
                      type="button"
                      onClick={() => setFiles([])}
                      className="hover:text-text-primary cursor-pointer transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
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
            disabled={saving}
            className="text-text-secondary hover:bg-surface-hover cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              saving ||
              (mode === "text" && !content.trim()) ||
              (mode === "file" && !files.length)
            }
            onClick={handleSubmit}
            className="bg-accent text-accent-foreground flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}

            {saving
              ? mode === "file"
                ? `Adding ${files.length} file${
                    files.length === 1 ? "" : "s"
                  }...`
                : "Adding..."
              : mode === "file"
                ? `Add ${files.length || ""} ${
                    files.length === 1 ? "File" : "Files"
                  }`
                : "Add to Board"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCardModal;
