import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";
import { loadGuestData } from "../lib/storage/guestStorage";
import { deleteExpiredGuestCards } from "../lib/storage/guestStorage";
import { createBoard, updateBoard, deleteBoard } from "../lib/api/boards";
import { createGroup, updateGroup, deleteGroup } from "../lib/api/groups";
import { createCard, updateCard, deleteCard, moveCard } from "../lib/api/cards";
import type { Board, CardGroup, ClipCard } from "../types";
import type { CreateBoardInput } from "../lib/api/boards";
import type { CreateGroupInput } from "../lib/api/groups";
import type { CreateCardInput } from "../lib/api/cards";

interface DataContextType {
  boards: Board[];
  groups: CardGroup[];
  cards: ClipCard[];
  loading: boolean;
  isGuest: boolean;

  activeBoardId: string | null;
  setActiveBoardId: (id: string | null) => void;

  refresh: () => Promise<void>;

  createBoard: (board: CreateBoardInput) => Promise<Board>;
  updateBoard: (id: string, patch: Partial<CreateBoardInput>) => Promise<Board>;
  deleteBoard: (id: string) => Promise<void>;

  createGroup: (group: CreateGroupInput) => Promise<CardGroup>;
  updateGroup: (
    id: string,
    patch: Partial<CreateGroupInput>,
  ) => Promise<CardGroup>;
  deleteGroup: (id: string) => Promise<void>;

  createCard: (card: CreateCardInput) => Promise<ClipCard>;
  updateCard: (
    id: string,
    patch: Partial<CreateCardInput>,
  ) => Promise<ClipCard>;
  deleteCard: (id: string) => Promise<void>;
  moveCard: (
    id: string,
    newPosition: number,
    newGroupId: string | null,
  ) => Promise<ClipCard>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();

  const [boards, setBoards] = useState<Board[]>([]);
  const [groups, setGroups] = useState<CardGroup[]>([]);
  const [cards, setCards] = useState<ClipCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);

  const isGuest = !user;

  const loadCloudData = useCallback(async () => {
    const [boardsRes, groupsRes, cardsRes] = await Promise.all([
      supabase.from("boards").select("*").order("position"),
      supabase.from("card_groups").select("*").order("position"),
      supabase.from("clips").select("*").order("position"),
    ]);

    if (boardsRes.error) throw boardsRes.error;
    if (groupsRes.error) throw groupsRes.error;
    if (cardsRes.error) throw cardsRes.error;

    setBoards(boardsRes.data ?? []);
    setGroups((groupsRes.data ?? []) as CardGroup[]);
    setCards((cardsRes.data ?? []) as ClipCard[]);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      if (user) {
        await loadCloudData();
      } else {
        const guest = await loadGuestData();

        setBoards(guest.boards);
        setGroups(guest.groups);
        setCards(guest.cards);
      }
    } catch (error) {
      console.error("Failed to load Clipboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, loadCloudData]);

  useEffect(() => {
    if (authLoading) return;

    void loadData();
  }, [authLoading, loadData]);

  /*
   * Guest mode has no pg_cron job. Run the local equivalent periodically.
   *
   * Cloud mode deliberately does NOT do this: cleanup-expired is already
   * handled server-side. Cloud cards are merely filtered by the UI while
   * waiting for that server cleanup.
   */
  useEffect(() => {
    if (!isGuest) return;

    const cleanup = async () => {
      try {
        await deleteExpiredGuestCards();

        setCards((current) =>
          current.filter(
            (card) =>
              card.pinned ||
              card.expires_at === null ||
              new Date(card.expires_at).getTime() > Date.now(),
          ),
        );
      } catch (error) {
        console.error("Failed to clean up expired guest cards:", error);
      }
    };

    void cleanup();

    const interval = window.setInterval(() => {
      void cleanup();
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [isGuest]);

  /*
   * Realtime is intentionally scoped to one board.
   *
   * DataProvider sits above RouterProvider, so it cannot use useParams().
   * Board.tsx reports its current route parameter through setActiveBoardId()
   * instead. Changing boards tears down the previous channel and creates a
   * new filtered subscription.
   */
  useEffect(() => {
    if (isGuest || !activeBoardId) return;

    const channel = supabase
      .channel(`clips:${activeBoardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clips",
          filter: `board_id=eq.${activeBoardId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const incoming = payload.new as ClipCard;

            setCards((current) => {
              if (current.some((card) => card.id === incoming.id)) {
                return current;
              }

              return [...current, incoming].sort(
                (a, b) => a.position - b.position,
              );
            });

            return;
          }

          if (payload.eventType === "UPDATE") {
            const incoming = payload.new as ClipCard;

            setCards((current) =>
              current
                .map((card) => (card.id === incoming.id ? incoming : card))
                .sort((a, b) => a.position - b.position),
            );

            return;
          }

          if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };

            setCards((current) =>
              current.filter((card) => card.id !== deleted.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeBoardId, isGuest]);

  const handleCreateBoard = useCallback(
    async (board: CreateBoardInput) => {
      // isGuest is derived directly from !user, so the previous
      // "!user && !isGuest" check could never be true and provided no guard.

      const created = await createBoard(
        isGuest,
        user?.id ?? "guest-local",
        board,
      );

      setBoards((current) =>
        [...current, created].sort((a, b) => a.position - b.position),
      );

      return created;
    },
    [isGuest, user],
  );

  const handleUpdateBoard = useCallback(
    async (id: string, patch: Partial<CreateBoardInput>) => {
      const updated = await updateBoard(isGuest, id, patch);

      setBoards((current) =>
        current.map((board) => (board.id === id ? updated : board)),
      );

      return updated;
    },
    [isGuest],
  );

  const handleDeleteBoard = useCallback(
    async (id: string) => {
      await deleteBoard(isGuest, id);

      setBoards((current) => current.filter((board) => board.id !== id));

      setGroups((current) => current.filter((group) => group.board_id !== id));

      setCards((current) => current.filter((card) => card.board_id !== id));
    },
    [isGuest],
  );

  const handleCreateGroup = useCallback(
    async (group: CreateGroupInput) => {
      const created = await createGroup(
        isGuest,
        user?.id ?? "guest-local",
        group,
      );

      setGroups((current) =>
        [...current, created].sort((a, b) => a.position - b.position),
      );

      return created;
    },
    [isGuest, user],
  );

  const handleUpdateGroup = useCallback(
    async (id: string, patch: Partial<CreateGroupInput>) => {
      const updated = await updateGroup(isGuest, id, patch);

      setGroups((current) =>
        current.map((group) => (group.id === id ? updated : group)),
      );

      return updated;
    },
    [isGuest],
  );

  const handleDeleteGroup = useCallback(
    async (id: string) => {
      await deleteGroup(isGuest, id);

      setGroups((current) => current.filter((group) => group.id !== id));

      // The API deliberately ungroups cards instead of deleting them.
      setCards((current) =>
        current.map((card) =>
          card.group_id === id ? { ...card, group_id: null } : card,
        ),
      );
    },
    [isGuest],
  );

  const handleCreateCard = useCallback(
    async (card: CreateCardInput) => {
      const created = await createCard(
        isGuest,
        user?.id ?? "guest-local",
        card,
      );

      setCards((current) =>
        [...current, created].sort((a, b) => a.position - b.position),
      );

      return created;
    },
    [isGuest, user],
  );

  const handleUpdateCard = useCallback(
    async (id: string, patch: Partial<CreateCardInput>) => {
      const updated = await updateCard(isGuest, id, patch);

      setCards((current) =>
        current.map((card) => (card.id === id ? updated : card)),
      );

      return updated;
    },
    [isGuest],
  );

  const handleDeleteCard = useCallback(
    async (id: string) => {
      await deleteCard(isGuest, id);

      setCards((current) => current.filter((card) => card.id !== id));
    },
    [isGuest],
  );

  const handleMoveCard = useCallback(
    async (id: string, newPosition: number, newGroupId: string | null) => {
      const updated = await moveCard(isGuest, id, newPosition, newGroupId);

      setCards((current) =>
        current
          .map((card) => (card.id === id ? updated : card))
          .sort((a, b) => a.position - b.position),
      );

      return updated;
    },
    [isGuest],
  );

  return (
    <DataContext.Provider
      value={{
        boards,
        groups,
        cards,
        loading,
        isGuest,

        activeBoardId,
        setActiveBoardId,

        refresh: loadData,

        createBoard: handleCreateBoard,
        updateBoard: handleUpdateBoard,
        deleteBoard: handleDeleteBoard,

        createGroup: handleCreateGroup,
        updateGroup: handleUpdateGroup,
        deleteGroup: handleDeleteGroup,

        createCard: handleCreateCard,
        updateCard: handleUpdateCard,
        deleteCard: handleDeleteCard,
        moveCard: handleMoveCard,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export function useData() {
  const ctx = useContext(DataContext);

  if (!ctx) {
    throw new Error("useData must be used within a DataProvider");
  }

  return ctx;
}
