import {
  ChevronDownIcon,
  ClockIcon,
  CopyIcon,
  Trash2Icon,
  PaletteIcon,
  PinIcon,
  PenLineIcon,
} from "lucide-react";
import type { ClipCard } from "../../types";
import { useEffect, useState } from "react";
import { formatExpiry, tagColorMap } from "../../utils/boardCardUtils";

interface CardProp {
  card: ClipCard;
}

const Card = ({ card }: CardProp) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [showExpiryMenu, setShowExpiryMenu] = useState(false);

  useEffect(() => {
    setTimeLeft(formatExpiry(card));
    const timer = setInterval(() => {
      setTimeLeft(formatExpiry(card));
    }, 60000);

    return () => clearInterval(timer);
  }, [card.expires_at]);

  const tagColor = tagColorMap[card.tag];
  return (
    <div
      data-card
      className="border-border-subtle bg-surface text-text-primary mb-2 rounded-xl border p-4 transition-all"
    >
      <div
        data-card-header
        className="border-border-subtle mb-2.5 flex items-center gap-1.5 border-b pb-2"
      >
        {card.tag !== "none" && (
          <span
            className={`${tagColor} inline-block h-3 w-3 rounded-full`}
          ></span>
        )}
        <button
          onClick={() => alert("implement this")}
          className="cursor-pointer"
        >
          <PinIcon
            className={`${card.pinned ? "text-link fill-link bg-link/20" : "text-text-muted hover:text-text-secondary hover:bg-surface-hover"} rounded-lg p-1`}
          />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowExpiryMenu(!showExpiryMenu)}
            className={`flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] transition-all ${
              card.pinned
                ? "border-blue-200/60 bg-blue-50 text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-300"
                : "border-amber-200/60 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60"
            }`}
            title="Click to change expiry duration or pin card"
          >
            <ClockIcon className="h-2.5 w-2.5" />
            <span>{timeLeft}</span>
            <ChevronDownIcon className="h-2.5 w-2.5 opacity-60" />
          </button>
          {/* drop menu pending */}
        </div>
        {card.created_at && (
          <span className="xs:inline hidden truncate font-mono text-[11px] text-neutral-400">
            {new Date(card.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2 opacity-80 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => console.log()}
            className="text-text-muted hover:bg-surface-hover hover:text-text-primary cursor-pointer rounded-lg p-1.5 transition-colors"
            title="Set card color tag"
          >
            <PaletteIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => console.log()}
            className="text-text-muted hover:bg-surface-hover hover:text-text-primary cursor-pointer rounded-lg p-1.5 transition-colors"
            title="Set card color tag"
          >
            <CopyIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => console.log()}
            className="text-text-muted hover:bg-surface-hover hover:text-text-primary cursor-pointer rounded-lg p-1.5 transition-colors"
            title="Set card color tag"
          >
            <Trash2Icon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {card.note ? (
        <div className="text-text-secondary text-xs font-bold">{card.note}</div>
      ) : (
        <span className="text-text-muted flex items-center gap-1 text-[11px] opacity-0 transition-opacity hover:opacity-100">
          <PenLineIcon className="h-3 w-3" /> + Add note
        </span>
      )}

      <p className="bg-secondary mt-2 rounded-lg p-2 font-mono text-[16px]">
        {card.content}
      </p>
    </div>
  );
};

export default Card;
