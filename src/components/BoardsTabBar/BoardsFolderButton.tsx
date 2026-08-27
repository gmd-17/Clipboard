import { ChevronDownIcon, FolderIcon, FolderOpenIcon } from "lucide-react";
import RoundCount from "./RoundCount";

interface BoardsFolderButtonProps {
  toggleFolderMenu: () => void;
  isFolderMenuOpen: boolean;
  boardsLength: number;
}

const BoardsFolderButton = ({
  toggleFolderMenu,
  isFolderMenuOpen,
  boardsLength,
}: BoardsFolderButtonProps) => {
  return (
    <button
      // ref={folderButtonRef}
      type="button"
      onClick={toggleFolderMenu}
      className={`flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-semibold shadow-xs transition-all ${
        isFolderMenuOpen
          ? "bg-accent text-accent-foreground border-accent"
          : "bg-secondary hover:bg-surface-hover border-border-subtle text-text-primary"
      }`}
      title="All Boards Directory"
    >
      {isFolderMenuOpen ? (
        <FolderOpenIcon className="h-4 w-4 shrink-0 text-amber-500" />
      ) : (
        <FolderIcon className="h-4 w-4 shrink-0 text-amber-500" />
      )}
      <span className="font-semibold tracking-tight">Boards</span>

      <RoundCount classToggle={isFolderMenuOpen} number={boardsLength} />

      <ChevronDownIcon
        className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform ${
          isFolderMenuOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  );
};

export default BoardsFolderButton;
