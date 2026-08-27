import { PlusIcon } from "lucide-react";
import { useState } from "react";
import BoardsFolderButton from "./BoardsFolderButton";
import BoardTab from "./BoardTab";
import { useData } from "../../context/DataContext";

const BoardsTabBar = () => {
  const { boards } = useData();

  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);

  const toggleFolderMenu = () => {
    setIsFolderMenuOpen((prev) => !prev);
  };

  const addNewBoard = () => {
    alert("implement this");
  };

  return (
    <div className="border-border-subtle bg-primary text-text-primary flex items-center gap-1 border-y">
      <div className="flex shrink-0 gap-2 p-2">
        <BoardsFolderButton
          toggleFolderMenu={toggleFolderMenu}
          isFolderMenuOpen={isFolderMenuOpen}
          boardsLength={boards.length}
        />

        <button
          type="button"
          onClick={addNewBoard}
          className="bg-secondary hover:bg-surface-hover border-border-subtle text-text-primary flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-semibold shadow-xs transition-all"
        >
          <PlusIcon className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>New Board</span>
        </button>
      </div>
      <div className="border-border-subtle mx-1 h-7 border-l-2"></div>

      <div data-board-tabs className="flex gap-1 overflow-x-auto py-1">
        {/* Boards tabs */}
        {boards.map((board) => {
          return <BoardTab key={board.id} boardId={board.id} />;
        })}
      </div>
    </div>
  );
};

export default BoardsTabBar;
