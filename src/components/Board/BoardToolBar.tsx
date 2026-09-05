import { useState } from "react";
import InputBox from "../../common/InputBox";
import { PlusCircleIcon, SearchIcon } from "lucide-react";
import { useParams } from "react-router";
import AddCardModal from "./AddCardModal";

const BoardToolBar = () => {
  const { boardId } = useParams<{ boardId: string }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div data-board-tool-bar className="flex px-4 py-2 sm:px-8">
      <div className="min-w-65 shrink-0">
        <InputBox
          id={"board-tool-bar-search"}
          type={"search"}
          required={false}
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={"Search notes, text, OCR..."}
          disabled={false}
          icon={<SearchIcon />}
          py="py-1"
        />
      </div>

      <button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="border-border-subtle hover:bg-surface-hover bg-surface text-text-secondary mx-3 flex cursor-pointer items-center gap-1 rounded-xl border px-2 py-1 transition-colors"
      >
        <PlusCircleIcon className="h-4 w-4" />
        Add Card
      </button>

      {isAddModalOpen && boardId && (
        <AddCardModal
          boardId={boardId}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
};

export default BoardToolBar;
