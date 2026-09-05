import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";

import { useData } from "../../context/DataContext";
import { isCardVisible } from "../../utils/boardCardUtils";

import BoardToolBar from "./BoardToolBar";
import Card from "./Card";
import CardModal from "./CardModal";

const Board = () => {
  const { boardId } = useParams<{ boardId: string }>();

  const { cards, loading, setActiveBoardId } = useData();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  useEffect(() => {
    setActiveBoardId(boardId ?? null);

    return () => setActiveBoardId(null);
  }, [boardId, setActiveBoardId]);

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

  const selectedCard = cards.find((card) => card.id === selectedCardId) ?? null;

  const handleCloseCard = useCallback(() => {
    setSelectedCardId(null);
  }, []);

  return (
    <>
      <div
        data-board
        className="bg-primary flex h-full min-h-0 flex-1 flex-col"
      >
        <BoardToolBar />

        <div
          data-cards-container
          className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-8"
        >
          <div
            data-cards-mansory
            className="columns-1 gap-2 [column-fill:balance] sm:columns-2 lg:columns-3 xl:columns-4"
          >
            {loading ? (
              // skeletons
              <></>
            ) : (
              boardCards.map((card) => (
                <Card key={card.id} card={card} onOpen={setSelectedCardId} />
              ))
            )}
          </div>
        </div>
      </div>

      {selectedCard && (
        <CardModal
          key={selectedCard.id}
          card={selectedCard}
          onClose={handleCloseCard}
        />
      )}
    </>
  );
};

export default Board;
