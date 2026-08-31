import {
  DownloadIcon,
  ExternalLinkIcon,
  FileIcon,
  FileTextIcon,
  LoaderCircleIcon,
  SparklesIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import type { ClipCard } from "../../types";
import { getFile } from "../../lib/storage/guestStorage";

interface CardContentProp {
  card: ClipCard;
}

const FILE_TYPES = new Set(["image", "pdf", "docx", "file"]);

/**
 * Format bytes for humans instead of displaying a raw number such as
 * "18473 bytes". The card metadata stores bytes because that's the useful
 * machine-readable value; formatting belongs in the UI.
 */
function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes < 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;

  for (const unit of units) {
    if (size < 1024) {
      return `${size < 10 ? size.toFixed(1) : Math.round(size)} ${unit}`;
    }

    size /= 1024;
  }

  return `${size.toFixed(1)} TB`;
}

const CardContent = ({ card }: CardContentProp) => {
  const [fileSrc, setFileSrc] = useState<string | null>(
    FILE_TYPES.has(card.type) ? card.content : null,
  );

  useEffect(() => {
    /*
     * Cloud file data lives in Supabase Storage and its signed URL is stored
     * in `content`. Guest file data lives in IndexedDB's `files` store.
     * Neither backend should ever put the actual file into `content` as base64.
     */
    if (!FILE_TYPES.has(card.type)) {
      setFileSrc(null);
      return;
    }

    // Cloud cards already have a usable signed URL.
    if (card.content) {
      setFileSrc(card.content);
      return;
    }

    // Guest cards have no URL in `content`, so retrieve their Blob locally.
    let cancelled = false;
    let objectUrl: string | null = null;

    const loadGuestFile = async () => {
      try {
        setFileSrc(null);

        const blob = await getFile(card.id);

        if (!blob) {
          console.warn(`No guest file found for card ${card.id}`);
          return;
        }

        objectUrl = URL.createObjectURL(blob);

        if (cancelled) {
          /*
           * The component may have unmounted while IndexedDB was loading.
           * Cleanup may already have run before this URL existed, so revoke
           * it immediately instead of leaking the object URL.
           */
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
          return;
        }

        setFileSrc(objectUrl);
      } catch (error) {
        console.error(`Failed to load guest file for card ${card.id}`, error);
      }
    };

    void loadGuestFile();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [card.id, card.type, card.content]);

  return (
    <div
      data-card-content-container
      className="bg-primary border-primary hover:border-border-subtle mt-2 cursor-pointer rounded-lg border p-2 font-mono text-[16px] transition-colors"
    >
      {/* ------------------------------------------------------------------ */}
      {/* TEXT                                                               */}
      {/* ------------------------------------------------------------------ */}

      {card.type === "text" && (
        <div
          onClick={() => alert(card)}
          className="text-text-primary line-clamp-6 font-mono text-xs leading-relaxed whitespace-pre-wrap"
        >
          {card.content}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* URL                                                                */}
      {/* ------------------------------------------------------------------ */}

      {card.type === "url" && (
        <div onClick={() => alert(card)} className="p-2">
          {card.og_image && (
            <div className="border-border-subtle bg-primary relative mb-2.5 aspect-video overflow-hidden rounded-xl border">
              <img
                src={card.og_image}
                alt={card.og_title || "Link Preview"}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Hide the preview frame if the cached image is unavailable.
                  (e.currentTarget.parentElement as HTMLElement)?.classList.add(
                    "hidden",
                  );
                }}
              />
            </div>
          )}

          <div className="space-y-1">
            <div className="text-text-muted flex items-center gap-1.5 font-mono text-[10px]">
              {card.og_favicon && (
                <img
                  src={card.og_favicon}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-3.5 w-3.5 shrink-0 rounded object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}

              <span className="truncate">
                {card.og_site_name || card.content}
              </span>
            </div>

            <h4 className="text-text-primary line-clamp-2 text-xs leading-snug font-semibold">
              {card.og_title || card.content}
            </h4>

            {card.og_description && (
              <p className="text-text-muted line-clamp-2 text-[11px] leading-relaxed">
                {card.og_description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* IMAGE                                                              */}
      {/* ------------------------------------------------------------------ */}

      {card.type === "image" && (
        <div
          onClick={() => alert(card)}
          className="relative aspect-4/3 cursor-pointer overflow-hidden bg-neutral-900"
        >
          {fileSrc ? (
            <img
              src={fileSrc}
              alt={card.file_name || "Pasted image"}
              className="h-full w-full object-cover transition-transform group-hover/item:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-neutral-500">
              <LoaderCircleIcon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Loading image...
            </div>
          )}

          {/* OCR indicator */}
          {card.ocr_text && (
            <div
              className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-neutral-900/80 px-1.5 py-0.5 font-mono text-[10px] text-amber-300 backdrop-blur-xs"
              title="Text extracted from this image"
            >
              <SparklesIcon className="h-2.5 w-2.5" />
              <span>OCR</span>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* PDF                                                                */}
      {/* ------------------------------------------------------------------ */}

      {card.type === "pdf" && (
        <div className="overflow-hidden rounded-md">
          {fileSrc ? (
            /*
             * Modern browsers have a built-in PDF viewer, so we can preview
             * a PDF without adding another React dependency. The same `src`
             * works for both a Supabase signed URL and a guest Blob URL.
             */
            <iframe
              src={fileSrc}
              title={card.file_name || "PDF preview"}
              className="h-64 w-full border-0 bg-neutral-900"
            />
          ) : (
            <div className="flex h-64 items-center justify-center bg-neutral-900 text-xs text-neutral-500">
              <LoaderCircleIcon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Loading PDF...
            </div>
          )}

          <FileInfo
            card={card}
            fileSrc={fileSrc}
            icon={<FileTextIcon className="h-5 w-5 text-red-400" />}
          />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* DOCX                                                               */}
      {/* ------------------------------------------------------------------ */}

      {card.type === "docx" && (
        <FileInfo
          card={card}
          fileSrc={fileSrc}
          icon={<FileTextIcon className="h-5 w-5 text-blue-400" />}
          description="Microsoft Word document"
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* GENERIC FILE                                                       */}
      {/* ------------------------------------------------------------------ */}

      {card.type === "file" && (
        <FileInfo
          card={card}
          fileSrc={fileSrc}
          icon={<FileIcon className="h-5 w-5 text-neutral-400" />}
          description={card.mime_type || "File"}
        />
      )}
    </div>
  );
};

interface FileInfoProps {
  card: ClipCard;
  fileSrc: string | null;
  icon: React.ReactNode;
  description?: string;
}

/**
 * Shared UI for downloadable files and formats that don't have a reliable
 * native browser preview (such as DOCX). Keeping this separate prevents the
 * individual card.type branches from becoming nearly identical copies.
 */
const FileInfo = ({ card, fileSrc, icon, description }: FileInfoProps) => {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="bg-surface-hover flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-text-primary truncate text-xs font-semibold">
          {card.file_name || "Unnamed file"}
        </div>

        <div className="text-text-muted mt-0.5 truncate text-[10px]">
          {description || card.mime_type || "File"}
          {" · "}
          {formatFileSize(card.file_size)}
        </div>
      </div>

      {fileSrc && (
        <div className="flex shrink-0 items-center gap-1">
          <a
            href={fileSrc}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="text-text-muted hover:bg-surface-hover hover:text-text-primary rounded-lg p-1.5 transition-colors"
            title="Open file"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>

          <a
            href={fileSrc}
            download={card.file_name || undefined}
            onClick={(event) => event.stopPropagation()}
            className="text-text-muted hover:bg-surface-hover hover:text-text-primary rounded-lg p-1.5 transition-colors"
            title="Download file"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};

export default CardContent;
