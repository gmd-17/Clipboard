import { useParams } from "react-router";
import { useData } from "../../context/DataContext";
import BoardToolBar from "./BoardToolBar";
import Card from "./Card";

const Board = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { boards, cards, groups } = useData();

  const board = boards.find((board) => board.id === boardId);
  const boardCards = cards.filter((card) => card.board_id === boardId);
  const boardGroups = groups.filter((groups) => groups.board_id === boardId);

  console.log(board);
  console.log(boardCards);
  console.log(boardGroups);

  return (
    <div data-board className="bg-primary flex-1">
      <BoardToolBar />

      <div
        data-cards-container
        className="columns-1 gap-4 px-4 [column-fill:balance] sm:columns-2 sm:px-8 lg:columns-3 xl:columns-4 2xl:columns-5"
      >
        {boardCards.map((card) => (
          <Card key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
};

export default Board;
