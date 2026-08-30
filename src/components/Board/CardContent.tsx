import { SparklesIcon } from "lucide-react";
import type { ClipCard } from "../../types";

interface CardContentProp {
  card: ClipCard;
}

const CardContent = ({ card }: CardContentProp) => {
  return (
    <>
      <div
        data-card-content-container
        // onClick={() => alert("pending card type")}
        className="bg-primary border-primary hover:border-border-subtle mt-2 cursor-pointer rounded-lg border p-2 font-mono text-[16px] transition-colors"
      >
        {/* Text type */}
        {card.type === "text" && (
          <div
            onClick={() => alert(card)}
            className="text-text-primary line-clamp-6 font-mono text-xs leading-relaxed whitespace-pre-wrap"
          >
            {card.content}
          </div>
        )}

        {/* URL type */}
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
                    // Hide broken image frame if thumbnail cannot load
                    (
                      e.currentTarget.parentElement as HTMLElement
                    )?.classList.add("hidden");
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

        {/* IMAGE ITEM */}
        {card.type === "image" && (
          <div
            onClick={() => alert(card)}
            className="relative aspect-4/3 cursor-pointer overflow-hidden bg-neutral-900"
          >
            <img
              src={card.content || "https://placehold.co/"}
              alt={card.file_name || "Pasted"}
              className="h-full w-full object-cover transition-transform group-hover/item:scale-105"
              loading="lazy"
            />
            {/* OCR text indicator badge */}
            {card.ocr_text && (
              <div
                className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-neutral-900/80 px-1.5 py-0.5 font-mono text-[10px] text-amber-300 backdrop-blur-xs"
                title="Extracted Text"
              >
                <SparklesIcon className="h-2.5 w-2.5" />
                <span>OCR</span>
              </div>
            )}
            {card.ocr_text && (
              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-neutral-900/80 px-1.5 py-0.5 font-mono text-[10px] text-neutral-300 backdrop-blur-xs">
                <span className="h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
                <span>OCR...</span>
              </div>
            )}
          </div>
        )}

        {/* more content types pending */}
      </div>
    </>
  );
};

export default CardContent;
