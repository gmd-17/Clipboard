import type { ClipCard } from "../types";

export type SearchMatchSource =
  "content" | "note" | "file_name" | "ocr" | "preview";

export interface CardSearchResult {
  matches: boolean;
  sources: SearchMatchSource[];
}

interface SearchableCardField {
  source: SearchMatchSource;
  value: string | null | undefined;
}

const normalizeSearchText = (value: string): string => {
  return value.trim().toLowerCase();
};

export const searchCard = (card: ClipCard, query: string): CardSearchResult => {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return {
      matches: true,
      sources: [],
    };
  }

  const fields: SearchableCardField[] = [
    {
      source: "content",
      value: card.content,
    },
    {
      source: "note",
      value: card.note,
    },
    {
      source: "file_name",
      value: card.file_name,
    },
    {
      source: "ocr",
      value: card.ocr_text,
    },
    {
      source: "preview",
      value: card.og_title,
    },
    {
      source: "preview",
      value: card.og_description,
    },
    {
      source: "preview",
      value: card.og_site_name,
    },
  ];

  const sources = fields
    .filter(({ value }) => {
      if (!value) {
        return false;
      }

      return normalizeSearchText(value).includes(normalizedQuery);
    })
    .map(({ source }) => source)
    .filter(
      (source, index, allSources) => allSources.indexOf(source) === index,
    );

  return {
    matches: sources.length > 0,
    sources,
  };
};

export const cardMatchesSearch = (card: ClipCard, query: string): boolean => {
  return searchCard(card, query).matches;
};

export const cardHasOcrMatch = (card: ClipCard, query: string): boolean => {
  return searchCard(card, query).sources.includes("ocr");
};

export const getPrimarySearchMatchSource = (
  sources: SearchMatchSource[],
): SearchMatchSource | null => {
  const priority: SearchMatchSource[] = [
    "ocr",
    "file_name",
    "content",
    "note",
    "preview",
  ];

  return priority.find((source) => sources.includes(source)) ?? null;
};
