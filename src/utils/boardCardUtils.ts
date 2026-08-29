import type { ClipCard, TagColor } from "../types";
import { type MouseEvent } from "react";

export const tagColorMap: Record<TagColor, string> = {
  none: "",
  red: "bg-red-600",
  amber: "bg-amber-600",
  emerald: "bg-emerald-600",
  blue: "bg-blue-600",
  purple: "bg-purple-600",
  rose: "bg-rose-600",
};

export const EXPIRY_OPTIONS = [
  { label: "1 Hour", hours: 1 },
  { label: "6 Hours", hours: 6 },
  { label: "12 Hours", hours: 12 },
  { label: "24 Hours", hours: 24 },
  { label: "48 Hours (Default)", hours: 48 },
  { label: "7 Days", hours: 168 },
  { label: "30 Days", hours: 720 },
  { label: "Never (Pin Card)", hours: 0 },
];
export const formatExpiry = (card: ClipCard) => {
  if (card.pinned || !card.expires_at) return "Pinned";

  const diffMs = new Date(card.expires_at).getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.round(hours / 24);
    return `${days}d left`;
  }

  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
};

// Match the closest standard option for checkmark display
export const getMatchedExpiryHours = (card: ClipCard): number => {
  // console.log(card.pinned);
  // console.log(card.expires_at);

  if (card.pinned || !card.expires_at) return 0;
  const createdAtMs = new Date(card.created_at || Date.now()).getTime();
  const expiresAtMs = new Date(card.expires_at).getTime();
  const totalHours = Math.round((expiresAtMs - createdAtMs) / (1000 * 60 * 60));

  // Find closest match among standard options
  const standardOptions = [1, 6, 12, 24, 48, 168, 720];
  let closest = 48;
  let minDiff = Infinity;
  for (const opt of standardOptions) {
    const diff = Math.abs(opt - totalHours);
    if (diff < minDiff) {
      minDiff = diff;
      closest = opt;
    }
  }
  return closest;
};

export function handleSelectExpiry(hours: number, e: MouseEvent): void {
  console.log(hours, e);
  throw new Error("Function not implemented.");
}
