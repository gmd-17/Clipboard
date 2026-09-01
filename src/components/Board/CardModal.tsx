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
} from "lucide-react";
import type { ClipCard, TagColor } from "../../types";
import type { CreateCardInput } from "../../lib/api/cards";
import { useData } from "../../context/DataContext";
import {
  EXPIRY_OPTIONS,
  getMatchedExpiryHours,
  tagColorMap,
} from "../../utils/boardCardUtils";
import MarkdownContent from "./MarkdownContent";

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
  const { updateCard, deleteCard } = useData();

  const [note, setNote] = useState(card.note ?? "");
  const [tag, setTag] = useState<TagColor>(card.tag);
  const [content, setContent] = useState(card.content ?? "");
  const [expiryHours, setExpiryHours] = useState(() =>
    card.pinned ? 0 : getMatchedExpiryHours(card),
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Close on Escape.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
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
    if (!window.confirm("Delete this card? This cannot be undone.")) return;

    setDeleting(true);

    try {
      await deleteCard(card.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete card:", error);
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-secondary border-border-subtle flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-border-subtle flex items-center gap-2 border-b px-5 py-4">
          <span className="text-text-muted">{TYPE_ICON[card.type]}</span>
          <span className="text-text-muted text-xs font-semibold tracking-wider uppercase">
            {card.type} card
          </span>

          <button
            onClick={onClose}
            className="text-text-muted hover:bg-surface-hover hover:text-text-primary ml-auto cursor-pointer rounded-lg p-1.5 transition-colors"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-text-muted text-xs font-semibold tracking-wider uppercase">
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="border-border-subtle bg-primary text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-border-focus/10 w-full resize-none rounded-xl border px-3 py-2 text-sm transition-all focus:ring-4 focus:outline-none"
            />
          </div>

          {/* Content — text cards only, for now */}
          {isTextContentEditable ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-text-muted text-xs font-semibold tracking-wider uppercase">
                  Content
                </label>

                <button
                  onClick={() => setPreviewMode((prev) => !prev)}
                  className="text-text-muted hover:text-text-primary flex cursor-pointer items-center gap-1 text-[11px] font-medium"
                >
                  {previewMode ? (
                    <>
                      <PencilIcon className="h-3 w-3" /> Edit
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-3 w-3" /> Preview
                    </>
                  )}
                </button>
              </div>

              {previewMode ? (
                <div className="border-border-subtle bg-primary max-h-64 min-h-32 overflow-y-auto rounded-xl border px-3 py-2">
                  <MarkdownContent content={content} />
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="border-border-subtle bg-primary text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-border-focus/10 w-full resize-y rounded-xl border px-3 py-2 font-mono text-xs transition-all focus:ring-4 focus:outline-none"
                />
              )}
            </div>
          ) : (
            <div className="border-border-subtle bg-primary text-text-muted rounded-xl border px-3 py-4 text-center text-xs">
              Editing content for {card.type} cards isn't supported yet — only
              the note, tag, and expiry can be changed here.
            </div>
          )}

          {/* Tag color */}
          <div className="space-y-1.5">
            <label className="text-text-muted text-xs font-semibold tracking-wider uppercase">
              Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setTag(option)}
                  title={option}
                  className={`h-7 w-7 cursor-pointer rounded-full border-2 transition-all ${
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
          <div className="space-y-1.5">
            <label className="text-text-muted text-xs font-semibold tracking-wider uppercase">
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
                  {option.hours === 0 && <PinIcon className="h-2.5 w-2.5" />}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-border-subtle flex items-center gap-2 border-t px-5 py-4">
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

export default CardModal;
