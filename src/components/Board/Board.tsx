import { useParams } from "react-router";
import { useData } from "../../context/DataContext";
import BoardToolBar from "./BoardToolBar";
import Card from "./Card";

const Board = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { boards, cards, groups, loading } = useData();

  const board = boards.find((board) => board.id === boardId);
  const boardCards = cards.filter((card) => card.board_id === boardId);
  const boardGroups = groups.filter((group) => group.board_id === boardId);

  console.log(board);
  console.log(boardCards);
  console.log(boardGroups);

  return (
    // <div data-board className="bg-primary flex flex-1 flex-col">
    //   <BoardToolBar />

    //   <div
    //     data-cards-container
    //     className="min-h-0 flex-1 columns-1 gap-4 overflow-y-auto px-4 [column-fill:balance] sm:columns-2 sm:px-8 lg:columns-3 xl:columns-4 2xl:columns-5"
    //   >
    //     {boardCards.map((card) => (
    //       <Card key={card.id} card={card} />
    //     ))}
    //   </div>
    // </div>

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
              // {/* 3. Added break-inside-avoid to prevent cards from splitting across columns */}
              boardCards.map((card) => <Card key={card.id} card={card} />)
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Board;
