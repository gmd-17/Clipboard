import { useParams } from "react-router";
import { useData } from "../../context/DataContext";
import BoardToolBar from "./BoardToolBar";
import Card from "./Card";
import { useEffect } from "react";
import { isCardVisible } from "../../utils/boardCardUtils";

const Board = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { boards, cards, groups, loading, setActiveBoardId } = useData();

  useEffect(() => {
    setActiveBoardId(boardId ?? null);

    return () => setActiveBoardId(null);
  }, [boardId, setActiveBoardId]);

  const board = boards.find((board) => board.id === boardId);

  // Expiry is a display concern here. In cloud mode, expired cards remain
  // in Supabase until the hourly cleanup job removes them.
  const boardCards = cards.filter(
    (card) => card.board_id === boardId && isCardVisible(card),
  );

  const boardGroups = groups.filter((group) => group.board_id === boardId);

  console.log(board);
  console.log(boardCards);
  console.log(boardGroups);

  return (
    <>
      <div
        data-board
        className="bg-primary flex h-full min-h-0 flex-1 flex-col"
      >
        <BoardToolBar />

        {/* 1. This wrapper absorbs the remaining space and handles the scrollbar */}
        <div
          data-cards-container
          className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-8"
        >
          {/* 2. This inner container handles ONLY the masonry column layout */}
          <div
            data-cards-mansory
            className="columns-1 gap-2 [column-fill:balance] sm:columns-2 lg:columns-3 xl:columns-4"
          >
            {loading ? (
              <>
                {/* temporary skeleton */}
                <div className="bg-surface mb-2 h-50 w-full animate-pulse break-inside-avoid-column rounded-2xl border">
                  1
                </div>

                <div className="bg-surface mb-2 h-50 w-full animate-pulse break-inside-avoid-column rounded-2xl border">
                  2
                </div>

                <div className="bg-surface mb-2 h-50 w-full animate-pulse break-inside-avoid-column rounded-2xl border">
                  3
                </div>
              </>
            ) : (
              // Expired cloud cards are hidden here but are not deleted.
              boardCards.map((card) => <Card key={card.id} card={card} />)
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Board;
