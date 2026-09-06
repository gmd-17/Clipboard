import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";

import { useData } from "../../context/DataContext";
import { isCardVisible, tagColorMap } from "../../utils/boardCardUtils";

import BoardToolBar from "./BoardToolBar";
import Card from "./Card";
import CardModal from "./CardModal";
import { useCardCapture } from "../../hooks/useCardCapture";
import {
  ChevronRightIcon,
  EllipsisIcon,
  PaletteIcon,
  PencilIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import {
  getPrimarySearchMatchSource,
  searchCard,
  type SearchMatchSource,
} from "../../utils/cardSearch";
import { useToast } from "../../context/ToastContext";
import RoundCount from "../BoardsTabBar/RoundCount";
import type { TagColor } from "../../types";

const Board = () => {
  const { boardId } = useParams<{ boardId: string }>();

  const {
    cards,
    loading,
    setActiveBoardId,
    groups,
    createCard,
    activeBoardId,
    updateCard,
    moveCard,
    updateGroup,
    deleteGroup,
  } = useData();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [openGroupMenuId, setOpenGroupMenuId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [colorPickerGroupId, setColorPickerGroupId] = useState<string | null>(
    null,
  );

  const GROUP_COLORS: readonly TagColor[] = [
    "red",
    "amber",
    "emerald",
    "blue",
    "purple",
    "rose",
  ] as const;

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((current) => {
      const next = new Set(current);

      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }

      return next;
    });
  };

  useEffect(() => {
    setActiveBoardId(boardId ?? null);
    // setSearchQuery("");

    return () => setActiveBoardId(null);
  }, [boardId, setActiveBoardId]);

  const { isDraggingFiles } = useCardCapture({
    activeBoardId,
    cards,
    createCard,
    updateCard,
  });

  const { showToast } = useToast();

  // Expiry is a display concern here. In cloud mode, expired cards remain
  // in Supabase until the hourly cleanup job removes them.
  const boardCards = cards
    .filter((card) => card.board_id === boardId && isCardVisible(card))
    .sort((a, b) => {
      // Sort by pinned first, then by position (if defined), then by creation time.
      if (a.pinned !== b.pinned) {
        return b.pinned ? 1 : -1;
      }
      if (a.position !== b.position) {
        return (a.position ?? Infinity) - (b.position ?? Infinity);
      }
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    });

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const searchedBoardCards = normalizedSearch
    ? boardCards
        .map((card) => ({
          card,
          searchResult: searchCard(card, normalizedSearch),
        }))
        .filter(({ searchResult }) => searchResult.matches)
    : boardCards.map((card) => ({
        card,
        searchResult: {
          matches: true,
          sources: [],
        },
      }));

  const filteredBoardCards = searchedBoardCards.map(({ card }) => card);

  const cardSearchMatchSources = new Map<string, SearchMatchSource>();

  searchedBoardCards.forEach(({ card, searchResult }) => {
    if (!searchResult.matches) {
      return;
    }

    const source = getPrimarySearchMatchSource(searchResult.sources);

    if (source) {
      cardSearchMatchSources.set(card.id, source);
    }
  });

  const boardGroups = groups.filter((group) => group.board_id === boardId);

  const selectedCard = cards.find((card) => card.id === selectedCardId) ?? null;

  const handleCloseCard = useCallback(() => {
    setSelectedCardId(null);
  }, []);

  const handleGroupDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    groupId: string | null,
  ) => {
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }

    setDragOverGroupId(groupId);
  };

  const handleGroupDragLeave = (
    event: React.DragEvent<HTMLDivElement>,
    groupId: string | null,
  ) => {
    const relatedTarget = event.relatedTarget;

    if (
      relatedTarget instanceof Node &&
      event.currentTarget.contains(relatedTarget)
    ) {
      return;
    }

    if (dragOverGroupId === groupId) {
      setDragOverGroupId(null);
    }
  };

  const handleGroupDrop = async (
    event: React.DragEvent<HTMLDivElement>,
    groupId: string | null,
  ) => {
    event.preventDefault();

    const cardId = event.dataTransfer.getData("text/card-id") || draggedCardId;

    setDragOverGroupId(null);
    setDraggedCardId(null);

    if (!cardId) {
      return;
    }

    const card = cards.find((item) => item.id === cardId);

    if (!card) {
      console.warn("[Board] Dropped card not found:", cardId);
      return;
    }

    if (card.group_id === groupId) {
      console.log("[Board] Card already belongs to this group:", {
        cardId,
        groupId,
      });
      return;
    }

    const targetCards = boardCards
      .filter((card) => card.id !== cardId)
      .filter((card) => {
        if (groupId === null) {
          return (
            !card.group_id ||
            !boardGroups.some((group) => group.id === card.group_id)
          );
        }

        return card.group_id === groupId;
      });

    const newPosition =
      targetCards.length > 0
        ? Math.max(...targetCards.map((card) => card.position ?? 0)) + 1
        : 0;

    console.log("[Board] Moving card to group:", {
      cardId,
      fromGroupId: card.group_id,
      toGroupId: groupId,
      newPosition,
    });

    try {
      await moveCard(cardId, newPosition, groupId);
      const destinationName =
        groupId === null
          ? "Ungrouped"
          : (boardGroups.find((group) => group.id === groupId)?.name ??
            "group");

      showToast({
        type: "success",
        title: "Card moved",
        description: `Moved to ${destinationName}`,
      });
    } catch (error) {
      console.error("[Board] Failed to move card:", error);
    }
  };

  // close the group menu when clicking outside of it
  useEffect(() => {
    if (!openGroupMenuId) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest("[data-group-menu]")) {
        return;
      }

      setOpenGroupMenuId(null);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [openGroupMenuId]);

  const startEditingGroup = (group: (typeof boardGroups)[number]) => {
    setOpenGroupMenuId(null);
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const cancelEditingGroup = () => {
    setEditingGroupId(null);
    setEditingGroupName("");
  };

  const saveGroupName = async () => {
    if (!editingGroupId) {
      return;
    }

    const name = editingGroupName.trim();

    if (!name) {
      showToast({
        type: "error",
        title: "Group name required",
        description: "Enter a name for the group.",
      });
      return;
    }

    const group = boardGroups.find((item) => item.id === editingGroupId);

    if (!group || name === group.name) {
      cancelEditingGroup();
      return;
    }

    try {
      await updateGroup(editingGroupId, {
        name,
      });

      showToast({
        type: "success",
        title: "Group renamed",
        description: `Renamed to "${name}"`,
      });

      cancelEditingGroup();
    } catch (error) {
      console.error("[Board] Failed to rename group:", error);

      showToast({
        type: "error",
        title: "Couldn't rename group",
        description: "Please try again.",
      });
    }
  };

  const changeGroupColor = async (
    groupId: string,
    color: (typeof GROUP_COLORS)[number],
  ) => {
    const group = boardGroups.find((item) => item.id === groupId);

    if (!group) {
      return;
    }

    try {
      await updateGroup(groupId, {
        color,
      });

      setColorPickerGroupId(null);
      setOpenGroupMenuId(null);

      showToast({
        type: "success",
        title: "Group color updated",
        description: `Updated "${group.name}" to ${color}.`,
      });
    } catch (error) {
      console.error("[Board] Failed to update group color:", error);

      showToast({
        type: "error",
        title: "Couldn't change group color",
        description: "Please try again.",
      });
    }
  };

  const handleDeleteGroup = async (group: (typeof boardGroups)[number]) => {
    const confirmed = window.confirm(
      `Delete "${group.name}"?\n\nThe cards in this group will be kept and moved to Ungrouped.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteGroup(group.id);

      setOpenGroupMenuId(null);
      setColorPickerGroupId(null);

      showToast({
        type: "success",
        title: "Group deleted",
        description: `"${group.name}" was deleted. Its cards were kept.`,
      });
    } catch (error) {
      console.error("[Board] Failed to delete group:", error);

      showToast({
        type: "error",
        title: "Couldn't delete group",
        description: "Please try again.",
      });
    }
  };

  return (
    <>
      {isDraggingFiles && (
        <div className="bg-accent/10 pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="border-accent bg-surface/95 flex w-full max-w-xl flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center shadow-2xl backdrop-blur-sm">
            <div className="bg-accent/15 text-accent mb-4 flex h-14 w-14 items-center justify-center rounded-full">
              <UploadIcon className="h-7 w-7" />
            </div>

            <h2 className="text-text-primary text-lg font-semibold">
              Drop files to add cards
            </h2>

            <p className="text-text-secondary mt-2 text-sm">
              Each file will become its own card on this board.
            </p>
          </div>
        </div>
      )}

      <div
        data-board
        className="bg-primary flex h-full min-h-0 flex-1 flex-col"
      >
        <BoardToolBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          boardGroups={boardGroups}
        />

        <div
          data-cards-container
          className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-8"
        >
          {boardGroups.map((group) => (
            <div
              key={group.id}
              data-board-group
              className={`mb-6 rounded-xl border border-transparent p-2 transition-all ${
                dragOverGroupId === group.id
                  ? "border-accent/40 bg-accent/5 ring-accent/20 ring-2"
                  : ""
              }`}

              onDragOver={(event) => handleGroupDragOver(event, group.id)}
              onDragLeave={(event) => handleGroupDragLeave(event, group.id)}
              onDrop={(event) => void handleGroupDrop(event, group.id)}
            >
              <div className="group/header border-border-subtle mb-2 flex items-center gap-2 border-b hover:rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="text-text-primary hover:bg-surface-hover flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold transition-colors"
                >
                  <ChevronRightIcon
                    className={`text-text-muted h-4 w-4 shrink-0 transition-transform ${collapsedGroups.has(group.id) ? "rotate-0" : "rotate-90"}`}
                  />

                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      group.color ? tagColorMap[group.color] : "bg-accent"
                    }`}
                  />

                  {editingGroupId === group.id ? (
                    <input
                      name="group-name-input"
                      autoFocus
                      value={editingGroupName}
                      onChange={(event) =>
                        setEditingGroupName(event.target.value)
                      }
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void saveGroupName();
                        }

                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelEditingGroup();
                        }
                      }}
                      onBlur={() => {
                        void saveGroupName();
                      }}
                      className="border-border-subtle focus:border-accent min-w-0 flex-1 border-b transition-colors outline-none"
                      aria-label="Group name"
                    />
                  ) : (
                    <span className="min-w-0 flex-1 truncate border-b border-transparent">
                      {group.name}
                    </span>
                  )}

                  <RoundCount
                    classToggle={false}
                    number={
                      filteredBoardCards.filter(
                        (card) => card.group_id === group.id,
                      ).length
                    }
                  />
                </button>

                <div data-group-menu className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();

                      setOpenGroupMenuId((current) =>
                        current === group.id ? null : group.id,
                      );
                    }}
                    className="text-text-muted hover:bg-surface-hover hover:text-text-primary cursor-pointer rounded-lg p-1.5 opacity-0 transition-colors group-hover/header:opacity-100"
                    aria-label={`Actions for ${group.name}`}
                    aria-expanded={openGroupMenuId === group.id}
                  >
                    <EllipsisIcon className="h-4 w-4" />
                  </button>

                  {openGroupMenuId === group.id && (
                    <div className="border-border-subtle bg-surface absolute top-full right-0 z-40 mt-1 w-44 rounded-xl border p-1.5 shadow-xl">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          startEditingGroup(group);
                        }}
                        className="text-text-secondary hover:bg-surface-hover hover:text-text-primary flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                        Rename
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          setColorPickerGroupId((current) =>
                            current === group.id ? null : group.id,
                          );
                        }}
                        className="text-text-secondary hover:bg-surface-hover hover:text-text-primary flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors"
                      >
                        <PaletteIcon className="h-3.5 w-3.5" />
                        Change color
                      </button>
                      {colorPickerGroupId === group.id && (
                        <div className="border-border-subtle mt-1 border-t pt-2">
                          <div className="text-text-muted mb-1.5 px-2.5 text-[10px] font-medium tracking-wide uppercase">
                            Group color
                          </div>

                          <div className="grid grid-cols-6 gap-1 px-2">
                            {GROUP_COLORS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void changeGroupColor(group.id, color);
                                }}
                                className="hover:bg-surface-hover flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors"
                                aria-label={`Set group color to ${color}`}
                              >
                                <span
                                  className={`h-3.5 w-3.5 rounded-full ${tagColorMap[color]}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-border-subtle my-1 border-t" />

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDeleteGroup(group);
                        }}
                        className="text-critical hover:bg-critical/10 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                        Delete group
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!collapsedGroups.has(group.id) && (
                <div
                  data-cards-mansory
                  className="columns-1 gap-2 [column-fill:balance] sm:columns-2 lg:columns-3 xl:columns-4"
                >
                  {loading ? (
                    <div className="text-text-muted flex h-full w-full items-center justify-center">
                      Loading...
                    </div>
                  ) : (
                    filteredBoardCards
                      .filter((card) => card.group_id === group.id)
                      .map((card) => (
                        <Card
                          searchMatchSource={
                            cardSearchMatchSources.get(card.id) ?? null
                          }
                          key={card.id}
                          card={card}
                          onOpen={setSelectedCardId}
                          onDragStart={setDraggedCardId}
                          onDragEnd={() => {
                            setDraggedCardId(null);
                            setDragOverGroupId(null);
                          }}
                        />
                      ))
                  )}
                </div>
              )}

              {draggedCardId !== null &&
                dragOverGroupId === group.id &&
                !filteredBoardCards.some(
                  (card) => card.group_id === group.id,
                ) && (
                  <div className="border-accent/50 bg-accent/5 text-accent mt-2 flex min-h-20 items-center justify-center rounded-xl border border-dashed text-xs font-medium">
                    Drop card here
                  </div>
                )}
            </div>
          ))}

          {/* 2. Render the final fallback group for cards with no group */}
          {!loading &&
            filteredBoardCards.some(
              (card) =>
                !card.group_id ||
                !boardGroups.some((g) => g.id === card.group_id),
            ) && (
              <div
                data-board-group
                className={`mb-6 rounded-xl transition-colors ${
                  draggedCardId !== null && dragOverGroupId === null
                    ? "bg-accent/10 ring-accent/40 ring-1"
                    : ""
                }`}
                onDragOver={(event) => handleGroupDragOver(event, null)}
                onDragLeave={(event) => handleGroupDragLeave(event, null)}
                onDrop={(event) => void handleGroupDrop(event, null)}
              >
                <h2 className="text-text-primary border-border-subtle mb-2 border-b pb-1 text-sm font-semibold">
                  Ungrouped
                </h2>
                <div
                  data-cards-mansory
                  className="columns-1 gap-2 [column-fill:balance] sm:columns-2 lg:columns-3 xl:columns-4"
                >
                  {filteredBoardCards
                    .filter(
                      (card) =>
                        !card.group_id ||
                        !boardGroups.some((g) => g.id === card.group_id),
                    )
                    .map((card) => (
                      <Card
                        searchMatchSource={
                          cardSearchMatchSources.get(card.id) ?? null
                        }
                        key={card.id}
                        card={card}
                        onOpen={setSelectedCardId}
                        onDragStart={setDraggedCardId}
                        onDragEnd={() => {
                          setDraggedCardId(null);
                          setDragOverGroupId(null);
                        }}
                      />
                    ))}
                </div>
              </div>
            )}
        </div>
      </div>

      {selectedCard && (
        <CardModal
          key={selectedCard.id}
          card={selectedCard}
          onClose={handleCloseCard}
        />
      )}
    </>
  );
};

export default Board;
