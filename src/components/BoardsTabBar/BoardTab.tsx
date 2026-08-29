import { NavLink } from "react-router";
import RoundCount from "./RoundCount";
import { useData } from "../../context/DataContext";

interface BoardTabProps {
  boardId: string;
  boardName: string;
}

const BoardTab = ({ boardId, boardName }: BoardTabProps) => {
  const { cards } = useData();
  // const [isActive, setIsActive] = useState(false);
  const cardsCount = cards.filter((card) => card.board_id === boardId).length;

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
