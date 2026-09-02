import { useEffect, useState } from "react";
import {
  XIcon,
  PinIcon,
  Trash2Icon,
  FileTextIcon,
  ImageIcon,
  LinkIcon,
  TypeIcon,
  FileIcon,
  EyeIcon,
  PencilIcon,
  LoaderCircleIcon,
} from "lucide-react";

import type { ClipCard, TagColor } from "../../types";
import type { CreateCardInput } from "../../lib/api/cards";

import { getCardFile } from "../../lib/api/cards";

import { useData } from "../../context/DataContext";

import {
  EXPIRY_OPTIONS,
  getMatchedExpiryHours,
  tagColorMap,
} from "../../utils/boardCardUtils";

import MarkdownContent from "./MarkdownContent";
import PdfPreview from "./PdfPreview";

interface CardModalProps {
  card: ClipCard;
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

const TYPE_ICON: Record<ClipCard["type"], React.ReactNode> = {
  text: <TypeIcon className="h-4 w-4" />,
  url: <LinkIcon className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  pdf: <FileTextIcon className="h-4 w-4" />,
  docx: <FileTextIcon className="h-4 w-4" />,
  file: <FileIcon className="h-4 w-4" />,
};

const CardModal = ({ card, onClose }: CardModalProps) => {
  const { updateCard, deleteCard, isGuest } = useData();

  const [note, setNote] = useState(card.note ?? "");
  const [tag, setTag] = useState<TagColor>(card.tag);
  const [content, setContent] = useState(card.content ?? "");

  const [expiryHours, setExpiryHours] = useState(() =>
    card.pinned ? 0 : getMatchedExpiryHours(card),
  );

  const [previewMode, setPreviewMode] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [file, setFile] = useState<Blob | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(card.type === "pdf");
  const [fileError, setFileError] = useState(false);

  /*
   * Load the actual PDF file when a PDF card is opened.
   *
   * getCardFile() handles both:
   * - Guest / IndexedDB
   * - Cloud / Supabase Storage
   */
  useEffect(() => {
    if (card.type !== "pdf") {
      setFile(null);
      setFileLoading(false);
      setFileError(false);
      return;
    }

    let cancelled = false;

    const loadFile = async () => {
      setFileLoading(true);
      setFileError(false);

      try {
        const result = await getCardFile(isGuest, card);

        if (cancelled) {
          return;
        }

        if (!result) {
          throw new Error("PDF file could not be loaded.");
        }

        setFile(result);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load PDF:", error);

        setFile(null);
        setFileError(true);
      } finally {
        if (!cancelled) {
          setFileLoading(false);
        }
      }
    };

    void loadFile();

    return () => {
      cancelled = true;
    };
  }, [card, isGuest]);

  /*
   * Create one temporary browser URL for the loaded file.
   *
   * The URL is reused while this file is active and revoked when
   * the file changes or the modal unmounts.
   */
  useEffect(() => {
    if (!file) {
      setFileUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setFileUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  /*
   * Close on Escape.
   */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const isTextContentEditable = card.type === "text";

  const handleSave = async () => {
    setSaving(true);

    try {
      const patch: Partial<CreateCardInput> = {
        note: note.trim() === "" ? null : note,
        tag,
      };

      if (expiryHours === 0) {
        patch.pinned = true;
        patch.expires_at = null;
      } else {
        patch.pinned = false;
        patch.expires_at = new Date(
          Date.now() + expiryHours * 60 * 60 * 1000,
        ).toISOString();
      }

      if (isTextContentEditable) {
        patch.content = content;
      }

      await updateCard(card.id, patch);

      onClose();
    } catch (error) {
      console.error("Failed to save card:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this card? This cannot be undone.")) {
      return;
    }

    setDeleting(true);

    try {
      await deleteCard(card.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete card:", error);
      setDeleting(false);
    }
  };

  const renderMainContent = () => {
    /*
     * PDF
     */
    if (card.type === "pdf") {
      if (fileLoading) {
        return (
          <div className="text-text-muted flex h-full min-h-64 items-center justify-center text-xs">
            <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
            Loading PDF...
          </div>
        );
      }

      if (fileError || !file) {
        return (
          <div className="text-text-muted flex h-full min-h-64 items-center justify-center text-xs">
            Failed to load PDF
          </div>
        );
      }

      if (!fileUrl) {
        return (
          <div className="text-text-muted flex h-full min-h-64 items-center justify-center text-xs">
            Loading PDF...
          </div>
        );
      }

      return (
        <PdfPreview
          src={fileUrl}
          className="h-full min-h-0 w-full"
          selectableText
        />
      );
    }

    /*
     * Image
     */

    //There is one thing I would change from the code above before you commit: the ImagePreview approach creates the object URL during render,which isn't ideal because React can render more than once.

    // For now, since our immediate target is PDF modal, I'd actually remove the image branch from this commit and keep image handling as the next small step. That keeps this commit focused and avoids introducing an unrelated object-URL lifecycle issue.

    // So in renderMainContent(), temporarily replace the image branch with:

    // if (card.type === "image") {
    //   return (
    //     <div className="flex h-full items-center justify-center p-8">
    //       <div className="rounded-xl border border-border-subtle bg-primary px-5 py-4 text-center text-xs text-text-muted">
    //         Image preview will be added next.
    //       </div>
    //     </div>
    //   );
    // }

    // Then remove the ImagePreview component entirely.
    if (card.type === "image") {
      if (fileLoading) {
        return (
          <div className="text-text-muted flex h-full min-h-64 items-center justify-center text-xs">
            <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
            Loading image...
          </div>
        );
      }

      if (fileError || !file) {
        return (
          <div className="text-text-muted flex h-full min-h-64 items-center justify-center text-xs">
            Failed to load image
          </div>
        );
      }

      const imageUrl = URL.createObjectURL(file);

      return <ImagePreview file={file} objectUrl={imageUrl} />;
    }

    /*
     * Text
     */
    if (card.type === "text") {
      return (
        <div className="h-full overflow-y-auto p-5">
          <div className="text-text-muted mb-2 text-[11px] font-semibold tracking-wider uppercase">
            Content
          </div>

          {previewMode ? (
            <div className="border-border-subtle bg-primary min-h-64 rounded-xl border px-4 py-3">
              <MarkdownContent content={content} />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="border-border-subtle bg-primary text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-border-focus/10 min-h-64 w-full resize-none rounded-xl border px-4 py-3 font-mono text-xs transition-all outline-none focus:ring-4"
            />
          )}
        </div>
      );
    }

    /*
     * URL
     */
    if (card.type === "url") {
      return (
        <div className="flex h-full items-center justify-center p-8">
          <div className="border-border-subtle bg-primary w-full max-w-xl rounded-2xl border p-6">
            <div className="text-text-muted mb-2 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
              <LinkIcon className="h-4 w-4" />
              URL
            </div>

            <a
              href={card.content ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent text-sm break-all hover:underline"
            >
              {card.content}
            </a>
          </div>
        </div>
      );
    }

    /*
     * Other file types for now.
     */
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="border-border-subtle bg-primary text-text-muted rounded-xl border px-5 py-4 text-center text-xs">
          Preview for {card.type} files isn't supported yet.
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-secondary border-border-subtle flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-border-subtle flex shrink-0 items-center gap-2 border-b px-5 py-3.5">
          <span className="text-text-muted">{TYPE_ICON[card.type]}</span>

          <div className="min-w-0">
            <div className="text-text-primary truncate text-sm font-semibold">
              {card.file_name ?? `${card.type} card`}
            </div>

            <div className="text-text-muted text-[10px] font-semibold tracking-wider uppercase">
              {card.type}
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-text-muted hover:bg-surface-hover hover:text-text-primary ml-auto cursor-pointer rounded-lg p-1.5 transition-colors"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Main */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Content / viewer */}
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden bg-neutral-900">
            {renderMainContent()}
          </div>

          {/* Card details */}
          <aside className="border-border-subtle bg-secondary w-full shrink-0 overflow-y-auto border-t md:w-72 md:border-t-0 md:border-l">
            <div className="space-y-6 p-5">
              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-text-muted text-[11px] font-semibold tracking-wider uppercase">
                  Note
                </label>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={4}
                  className="border-border-subtle bg-primary text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-border-focus/10 w-full resize-none rounded-xl border px-3 py-2.5 text-sm transition-all focus:ring-4 focus:outline-none"
                />
              </div>

              {/* Text preview toggle */}
              {card.type === "text" && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-[11px] font-semibold tracking-wider uppercase">
                    Content
                  </span>

                  <button
                    onClick={() => setPreviewMode((prev) => !prev)}
                    className="text-text-muted hover:text-text-primary flex cursor-pointer items-center gap-1 text-[11px] font-medium"
                  >
                    {previewMode ? (
                      <>
                        <PencilIcon className="h-3 w-3" />
                        Edit
                      </>
                    ) : (
                      <>
                        <EyeIcon className="h-3 w-3" />
                        Preview
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Tag */}
              <div className="space-y-2">
                <label className="text-text-muted text-[11px] font-semibold tracking-wider uppercase">
                  Tag
                </label>

                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => setTag(option)}
                      title={option}
                      aria-label={`Set tag to ${option}`}
                      className={`h-7 w-7 cursor-pointer rounded-full border-2 transition-all ${
                        tag === option
                          ? "border-text-primary scale-110"
                          : "border-transparent"
                      } ${
                        option === "none"
                          ? "bg-surface-hover"
                          : tagColorMap[option]
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Expiry */}
              <div className="space-y-2">
                <label className="text-text-muted text-[11px] font-semibold tracking-wider uppercase">
                  Expiry
                </label>

                <div className="flex flex-wrap gap-1.5">
                  {EXPIRY_OPTIONS.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => setExpiryHours(option.hours)}
                      className={`flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                        expiryHours === option.hours
                          ? "bg-accent text-accent-foreground border-accent"
                          : "border-border-subtle bg-primary text-text-secondary hover:bg-surface-hover"
                      }`}
                    >
                      {option.hours === 0 && (
                        <PinIcon className="h-2.5 w-2.5" />
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <div className="border-border-subtle flex shrink-0 items-center gap-2 border-t px-5 py-3.5">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-critical hover:bg-critical/10 flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Trash2Icon className="h-3.5 w-3.5" />

            {deleting ? "Deleting..." : "Delete"}
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-text-secondary hover:bg-surface-hover cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-accent text-accent-foreground cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ImagePreviewProps {
  file: Blob;
  objectUrl: string;
}

const ImagePreview = ({ file, objectUrl }: ImagePreviewProps) => {
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  return (
    <div className="flex h-full items-center justify-center overflow-auto p-6">
      <img
        src={objectUrl}
        alt={file.type || "Image preview"}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
};

export default CardModal;
