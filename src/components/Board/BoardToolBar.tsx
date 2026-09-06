import { useEffect, useRef, useState } from "react";
import InputBox from "../../common/InputBox";
import {
  FolderPlusIcon,
  PlusCircleIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useParams } from "react-router";
import AddCardModal from "./AddCardModal";
import { useData } from "../../context/DataContext";
import type { CardGroup } from "../../types";

interface BoardToolBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  boardGroups: CardGroup[];
}

const BoardToolBar = ({
  searchQuery,
  onSearchChange,
  boardGroups,
}: BoardToolBarProps) => {
  const { boardId } = useParams<{ boardId: string }>();
  const { createGroup } = useData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const createGroupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showCreateGroup) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (target instanceof Node && createGroupRef.current?.contains(target)) {
        return;
      }

      setShowCreateGroup(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [showCreateGroup]);

  const handleCreateGroup = async () => {
    console.log(
      "[BoardToolBar] handleCreateGroup called with name:",
      newGroupName,
    );
    const name = newGroupName.trim();

    if (!name || !boardId || isCreatingGroup) {
      return;
    }

    try {
      setIsCreatingGroup(true);

      await createGroup({
        board_id: boardId,
        name,
        color: null,
        position: boardGroups.length,
      });

      setNewGroupName("");
      setShowCreateGroup(false);
    } catch (error) {
      console.error("[BoardToolBar] Failed to create group:", error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <div data-board-tool-bar className="flex px-4 py-2 sm:px-8">
      <div className="min-w-65 shrink-0">
        <InputBox
          id={"board-tool-bar-search"}
          type={"search"}
          required={false}
          value={searchQuery}
          onChange={onSearchChange}
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
      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setShowCreateGroup((current) => !current);
            setNewGroupName("");
          }}
          className="border-border-subtle bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors"
        >
          <FolderPlusIcon className="h-3.5 w-3.5" />
          New Group
        </button>
        {showCreateGroup && (
          <div
            data-board-create-group
            ref={createGroupRef}
            className="border-border-subtle bg-surface absolute top-full left-0 z-40 mt-2 w-72 rounded-xl border p-3 shadow-xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-text-primary text-xs font-semibold">
                New Group
              </h3>

              <button
                type="button"
                onClick={() => {
                  setShowCreateGroup(false);
                  setNewGroupName("");
                }}
                className="text-text-muted hover:bg-surface-hover hover:text-text-primary cursor-pointer rounded-md p-1 transition-colors"
                aria-label="Close"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            <input
              type="text"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleCreateGroup();
                }

                if (event.key === "Escape") {
                  setShowCreateGroup(false);
                  setNewGroupName("");
                }
              }}
              placeholder="Group name..."
              autoFocus
              className="border-border-subtle bg-primary text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-accent/20 w-full rounded-lg border px-3 py-2 text-xs transition-colors outline-none focus:ring-2"
            />

            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateGroup(false);
                  setNewGroupName("");
                }}
                className="text-text-muted hover:bg-surface-hover hover:text-text-primary cursor-pointer rounded-lg px-2.5 py-1.5 text-[11px] transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!newGroupName.trim() || isCreatingGroup}
                onClick={() => void handleCreateGroup()}
                className="bg-accent hover:bg-accent/90 focus:bg-accent/90 text-accent-foreground focus:ring-accent/50 cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingGroup ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        )}

        {/* existing Add Card button */}
      </div>

      {isAddModalOpen && boardId && (
        <AddCardModal
          boardId={boardId}
          onClose={() => setIsAddModalOpen(false)}
          boardGroups={boardGroups}
        />
      )}
    </div>
  );
};

export default BoardToolBar;
