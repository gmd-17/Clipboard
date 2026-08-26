import { ChevronDownIcon, Folder, FolderOpen, PlusIcon } from "lucide-react";
import { useState } from "react";

const BoardsTab = () => {
  const [boards, setBoards] = useState<string[]>([]);
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);

  const toggleFolderMenu = () => {
    setIsFolderMenuOpen((prev) => !prev);
  };

  const addNewBoard = () => {
    alert("implement this");
    setBoards([...boards, "push"]);
  };

  return (
    <div className="border-border-subtle bg-primary text-text-primary flex border-y p-2">
      <div className="flex h-9 gap-2">
        <button
          // ref={folderButtonRef}
          type="button"
          onClick={toggleFolderMenu}
          className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-semibold shadow-xs transition-all ${
            isFolderMenuOpen
              ? "bg-accent text-accent-foreground border-accent"
              : "bg-secondary hover:bg-surface-hover border-border-subtle text-text-primary"
          }`}
          title="All Boards Directory"
        >
          {isFolderMenuOpen ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-amber-500" />
          )}
          <span className="font-semibold tracking-tight">Boards</span>

          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-medium transition-colors ${
              isFolderMenuOpen
                ? "bg-accent-foreground/10 text-accent-foreground"
                : "bg-surface text-text-secondary"
            }`}
          >
            {boards.length}
          </span>

          <ChevronDownIcon
            className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform ${
              isFolderMenuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <button
          type="button"
          onClick={addNewBoard}
          className="bg-secondary hover:bg-surface-hover border-border-subtle text-text-primary flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-semibold shadow-xs transition-all"
        >
          <PlusIcon className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>New Board</span>
        </button>
      </div>
    </div>
  );
};

export default BoardsTab;
