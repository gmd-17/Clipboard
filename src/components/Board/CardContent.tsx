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
import { getCardFile } from "../../lib/api/cards";
import { useData } from "../../context/DataContext";
import MarkdownContent from "./MarkdownContent";

interface CardContentProp {
  card: ClipCard;
  onOpen: (id: string) => void;
}

/*
 * These are the card types whose actual data lives in a file Blob.
 *
 * `text` is deliberately not included because a normal text card stores
 * its content directly in the clips row.
 */
const FILE_TYPES = new Set(["image", "pdf", "docx", "file"]);

/**
 * A `file` card can represent many file formats. For plain text files,
 * we can read the Blob directly with blob.text() and render the result
 * inside <pre>.
 *
 * MIME type is preferred, but the filename extension is a useful fallback
 * for older/imported cards that may not have mime_type populated.
 */
const isTextFile = (card: ClipCard): boolean => {
  if (card.type !== "file") {
    return false;
  }

  if (card.mime_type?.startsWith("text/")) {
    return true;
  }

  return card.file_name?.toLowerCase().endsWith(".txt") ?? false;
};

/**
 * Format bytes for humans instead of displaying a raw number.
 */
function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes < 0) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

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

const CardContent = ({ card, onOpen }: CardContentProp) => {
  const { isGuest } = useData();

  const [fileSrc, setFileSrc] = useState<string | null>(
    FILE_TYPES.has(card.type) ? card.content : null,
  );

  const [fileText, setFileText] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const textFile = isTextFile(card);

  useEffect(() => {
    /*
     * Normal text/URL cards don't have a file Blob to load.
     */
    if (!FILE_TYPES.has(card.type)) {
      setFileSrc(null);
      setFileText(null);
      setFileError(null);
      setFileLoading(false);
      return;
    }

    let cancelled = false;

    /*
     * This variable is deliberately local to this effect.
     *
     * When we create an object URL for a Blob, the cleanup function below
     * must revoke that exact URL when this card leaves the screen or the
     * underlying file changes.
     */
    let objectUrl: string | null = null;

    const loadFile = async () => {
      setFileLoading(true);
      setFileError(null);

      /*
       * Clear previous content while the new file is loading.
       * This prevents an old card/file preview from briefly appearing
       * while React is switching to another card.
       */
      setFileSrc(null);
      setFileText(null);

      try {
        const blob = await getCardFile(isGuest, card);

        if (!blob) {
          throw new Error(`No file found for card ${card.id}.`);
        }

        /*
         * Plain text is special:
         *
         * We don't need URL.createObjectURL() here. Blob.text() gives us
         * the actual text directly, which can then be rendered in <pre>.
         *
         * This is also why there is no URL.revokeObjectURL() needed for
         * .txt files.
         */
        if (textFile) {
          const text = await blob.text();

          /*
           * The inline preview uses the text directly, but we also create an
           * object URL because FileInfo needs a URL for its Open and Download
           * actions.
           */
          objectUrl = URL.createObjectURL(blob);

          if (cancelled) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
            return;
          }

          setFileText(text);
          setFileSrc(objectUrl);

          return;
        }

        /*
         * Images, PDFs, DOCX files, and other binary files need a URL
         * that browser elements/links can consume.
         *
         * This creates a temporary browser URL pointing at the Blob.
         */
        objectUrl = URL.createObjectURL(blob);

        if (cancelled) {
          /*
           * IndexedDB may finish loading after the component has already
           * unmounted. In that case the normal cleanup ran before this
           * object URL existed, so revoke it immediately.
           */
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
          return;
        }

        setFileSrc(objectUrl);
      } catch (error) {
        if (!cancelled) {
          console.error(`Failed to load file for card ${card.id}:`, error);

          setFileSrc(null);
          setFileText(null);
          setFileError("Unable to preview this file.");
        }
      } finally {
        if (!cancelled) {
          setFileLoading(false);
        }
      }
    };

    void loadFile();

    return () => {
      cancelled = true;

      /*
       * Object URLs are browser-managed references to Blob data.
       * They are not automatically revoked just because React stops
       * rendering the <img>/<iframe>, so we explicitly release them.
       */
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [
    card.id,
    card.type,
    card.file_name,
    card.mime_type,
    card.file_path,
    isGuest,
    textFile,
  ]);

  return (
    <div
      data-card-content-container
      onClick={() => onOpen(card.id)}
      className="bg-primary border-primary hover:border-border-subtle mt-2 cursor-pointer rounded-lg border p-2 font-mono text-[16px] transition-colors"
    >
      {/* ------------------------------------------------------------------ */}
      {/* TEXT                                                               */}
      {/* ------------------------------------------------------------------ */}

      {card.type === "text" && (
        <div className="text-text-primary line-clamp-6 text-xs leading-relaxed">
          <MarkdownContent content={card.content ?? ""} />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* URL                                                                */}
      {/* ------------------------------------------------------------------ */}

      {card.type === "url" && (
        <div className="p-2">
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
        <div className="relative aspect-4/3 cursor-pointer overflow-hidden bg-neutral-900">
          {fileLoading && !fileSrc && (
            <div className="flex h-full items-center justify-center text-xs text-neutral-500">
              <LoaderCircleIcon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Loading image...
            </div>
          )}

          {fileError && (
            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-red-400">
              {fileError}
            </div>
          )}

          {fileSrc && (
            <img
              src={fileSrc}
              alt={card.file_name || "Pasted image"}
              className="h-full w-full object-cover transition-transform group-hover/item:scale-105"
              loading="lazy"
            />
          )}

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
          {fileLoading && !fileSrc && (
            <div className="flex h-64 items-center justify-center bg-neutral-900 text-xs text-neutral-500">
              <LoaderCircleIcon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Loading PDF...
            </div>
          )}

          {fileError && (
            <div className="flex h-64 items-center justify-center bg-neutral-900 px-3 text-center text-xs text-red-400">
              {fileError}
            </div>
          )}

          {fileSrc && (
            /*
             * Modern browsers have a built-in PDF viewer, so we can preview
             * the PDF without adding another React dependency.
             *
             * fileSrc is a temporary Blob URL in guest mode and is produced
             * from the cloud file by getCardFile() in cloud mode.
             */
            <div className="cursor-pointer">
              <iframe
                src={fileSrc}
                title={card.file_name || "PDF preview"}
                className="pointer-events-none h-64 w-full border-0 bg-neutral-900"
              />
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
      {/* PLAIN TEXT FILE                                                    */}
      {/* ------------------------------------------------------------------ */}

      {/* Plain text file (.txt and other text/* files) */}
      {textFile && (
        <div className="overflow-hidden rounded-md">
          {/* The actual text preview stays inline so users can read the file
        without leaving the board. */}
          {fileLoading && (
            <div className="text-text-muted flex items-center gap-2 px-2.5 py-3 text-[11px]">
              <LoaderCircleIcon className="h-3.5 w-3.5 animate-spin" />
              Loading file...
            </div>
          )}

          {fileError && (
            <div className="text-critical px-2.5 py-3 text-[11px]">
              {fileError}
            </div>
          )}

          {!fileLoading && !fileError && fileText !== null && (
            <pre className="text-text-primary max-h-56 overflow-auto px-2.5 py-2.5 font-mono text-[11px] leading-relaxed wrap-break-word whitespace-pre-wrap">
              {fileText}
            </pre>
          )}

          {/* Keep the same file metadata/actions used by other file cards.
        fileSrc is the temporary Blob URL created by the effect above. */}
          <FileInfo
            card={card}
            fileSrc={fileSrc}
            icon={<FileTextIcon className="h-5 w-5 text-blue-400" />}
            description={card.mime_type || "Plain text file"}
          />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* GENERIC FILE                                                       */}
      {/* ------------------------------------------------------------------ */}

      {card.type === "file" && !textFile && (
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
 * native browser preview, such as DOCX.
 *
 * Keeping this separate prevents the individual card.type branches from
 * becoming nearly identical copies.
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
