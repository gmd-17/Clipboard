import { NavLink } from "react-router";
import RoundCount from "./RoundCount";
import { useData } from "../../context/DataContext";
import { useEffect, useState } from "react";

interface BoardTabProps {
  boardId: string;
  boardName: string;
}

const BoardTab = ({ boardId, boardName }: BoardTabProps) => {
  const { cards } = useData();
  const [cardsCount, setCardsCount] = useState(0);

  useEffect(() => {
    const newCardsCount = cards.filter(
      (card) => card.board_id === boardId,
    ).length;

    setCardsCount(newCardsCount);
  }, [cards]);

  return (
    <NavLink
      to={`/${boardId}`}
      className={({ isActive }) =>
        `flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-semibold shadow-xs transition-all ${
          isActive
            ? "bg-accent text-accent-foreground border-accent"
            : "bg-secondary hover:bg-surface-hover border-border-subtle text-text-primary"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {boardName}
          <RoundCount classToggle={isActive} number={cardsCount} />
        </>
      )}
    </NavLink>
  );
};

export default BoardTab;
