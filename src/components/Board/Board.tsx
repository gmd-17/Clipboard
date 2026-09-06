import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";

import { useData } from "../../context/DataContext";
import { isCardVisible } from "../../utils/boardCardUtils";

import BoardToolBar from "./BoardToolBar";
import Card from "./Card";
import CardModal from "./CardModal";
import { useCardCapture } from "../../hooks/useCardCapture";
import { UploadIcon } from "lucide-react";

const Board = () => {
  const { boardId } = useParams<{ boardId: string }>();

  const {
    cards,
    loading,
    setActiveBoardId,
    groups,
    createCard,
    activeBoardId,
    updateCard,
  } = useData();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setActiveBoardId(boardId ?? null);
    // setSearchQuery("");

    return () => setActiveBoardId(null);
  }, [boardId, setActiveBoardId]);

  const { isDraggingFiles, captureMessage } = useCardCapture({
    activeBoardId,
    cards,
    createCard,
    updateCard,
  });

  // Expiry is a display concern here. In cloud mode, expired cards remain
  // in Supabase until the hourly cleanup job removes them.
  const boardCards = cards
    .filter((card) => card.board_id === boardId && isCardVisible(card))
    .sort((a, b) => {
      // Sort by pinned first, then by position (if defined), then by creation time.
      if (a.pinned !== b.pinned) {
        return b.pinned ? 1 : -1;
      }
      if (a.position !== b.position) {
        return (a.position ?? Infinity) - (b.position ?? Infinity);
      }
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    });

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredBoardCards = normalizedSearch
    ? boardCards.filter((card) => {
        const searchableText = [
          card.content,
          card.note,
          card.file_name,
          card.ocr_text,
          card.og_title,
          card.og_description,
          card.og_site_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
    : boardCards;

  const boardGroups = groups.filter((group) => group.board_id === boardId);

  const selectedCard = cards.find((card) => card.id === selectedCardId) ?? null;

  const handleCloseCard = useCallback(() => {
    setSelectedCardId(null);
  }, []);

  return (
    <>
      {isDraggingFiles && (
        <div className="bg-accent/10 pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="border-accent bg-surface/95 flex w-full max-w-xl flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center shadow-2xl backdrop-blur-sm">
            <div className="bg-accent/15 text-accent mb-4 flex h-14 w-14 items-center justify-center rounded-full">
              <UploadIcon className="h-7 w-7" />
            </div>

            <h2 className="text-text-primary text-lg font-semibold">
              Drop files to add cards
            </h2>

            <p className="text-text-secondary mt-2 text-sm">
              Each file will become its own card on this board.
            </p>
          </div>
        </div>
      )}

      <div
        data-board
        className="bg-primary flex h-full min-h-0 flex-1 flex-col"
      >
        <BoardToolBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div
          data-cards-container
          className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-8"
        >
          {boardGroups.map((group) => (
            <div key={group.id} data-board-group className="mb-6">
              <h2 className="text-text-primary border-border-subtle mb-2 border-b pb-1 text-sm font-semibold">
                {group.name}
              </h2>
              <div
                data-cards-mansory
                className="columns-1 gap-2 [column-fill:balance] sm:columns-2 lg:columns-3 xl:columns-4"
              >
                {}
                {loading ? (
                  <div className="text-text-muted flex h-full w-full items-center justify-center">
                    Loading...
                  </div>
                ) : (
                  filteredBoardCards
                    .filter((card) => card.group_id === group.id)
                    .map((card) => (
                      <Card
                        key={card.id}
                        card={card}
                        onOpen={setSelectedCardId}
                      />
                    ))
                )}
              </div>
            </div>
          ))}

          {/* 2. Render the final fallback group for cards with no group */}
          {!loading &&
            filteredBoardCards.some(
              (card) =>
                !card.group_id ||
                !boardGroups.some((g) => g.id === card.group_id),
            ) && (
              <div data-board-group className="mb-6">
                <h2 className="text-text-primary border-border-subtle mb-2 border-b pb-1 text-sm font-semibold">
                  Ungrouped
                </h2>
                <div
                  data-cards-mansory
                  className="columns-1 gap-2 [column-fill:balance] sm:columns-2 lg:columns-3 xl:columns-4"
                >
                  {filteredBoardCards
                    .filter(
                      (card) =>
                        !card.group_id ||
                        !boardGroups.some((g) => g.id === card.group_id),
                    )
                    .map((card) => (
                      <Card
                        key={card.id}
                        card={card}
                        onOpen={setSelectedCardId}
                      />
                    ))}
                </div>
              </div>
            )}
        </div>
      </div>

      {selectedCard && (
        <CardModal
          key={selectedCard.id}
          card={selectedCard}
          onClose={handleCloseCard}
        />
      )}

      {captureMessage && (
        <div
          role="status"
          className="bg-surface border-border-subtle text-text-primary fixed right-4 bottom-4 z-60 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg"
        >
          <span className="bg-accent h-2 w-2 rounded-full" />
          {captureMessage}
        </div>
      )}
    </>
  );
};

export default Board;
