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
import type { Board, CardGroup, ClipCard } from "../types";

interface DataContextType {
  boards: Board[];
  groups: CardGroup[];
  cards: ClipCard[];
  loading: boolean;
  isGuest: boolean;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [groups, setGroups] = useState<CardGroup[]>([]);
  const [cards, setCards] = useState<ClipCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Per project notes, clips should be Realtime-subscribed filtered by board_id;
  //  I don't see any supabase.channel(...) subscription yet in DataContext.
  //  Flagging since it's called out explicitly in your spec — probably just not built yet.

  async function loadCloudData() {
    try {
      const [boardsRes, groupsRes, cardsRes] = await Promise.all([
        supabase.from("boards").select("*").order("position"),
        supabase.from("card_groups").select("*").order("position"),
        supabase.from("clips").select("*").order("position"),
      ]);
      setBoards(boardsRes.data ?? []);
      setGroups((groupsRes.data ?? []) as CardGroup[]);
      setCards((cardsRes.data ?? []) as ClipCard[]);
    } catch (error) {
      console.error("Failed to load cloud data ", error);
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    if (user) {
      await loadCloudData();
    } else {
      const guest = await loadGuestData();
      setBoards(guest.boards);
      setGroups(guest.groups);
      setCards(guest.cards);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    loadData();
  }, [authLoading, loadData]);

  return (
    <DataContext.Provider
      value={{
        boards,
        groups,
        cards,
        loading,
        isGuest: !user,
        refresh: loadData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
