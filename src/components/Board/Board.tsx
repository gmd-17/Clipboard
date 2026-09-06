import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";

import { useData } from "../../context/DataContext";
import { isCardVisible } from "../../utils/boardCardUtils";

import BoardToolBar from "./BoardToolBar";
import Card from "./Card";
import CardModal from "./CardModal";
import { useCardCapture } from "../../hooks/useCardCapture";
import { UploadIcon } from "lucide-react";
import {
  getPrimarySearchMatchSource,
  searchCard,
  type SearchMatchSource,
} from "../../utils/cardSearch";
import { useToast } from "../../context/ToastContext";

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
  } = useData();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

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
              <h2 className="text-text-primary border-border-subtle mb-2 border-b pb-1 text-sm font-semibold">
                {group.name}
              </h2>
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
