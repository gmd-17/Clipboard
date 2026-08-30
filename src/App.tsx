import { Outlet, useNavigate, useParams } from "react-router";
import "./App.css";
import { useAuth } from "./context/AuthContext";
import HeaderNav from "./components/HeaderNav";
import BoardsTabBar from "./components/BoardsTabBar/BoardsTabBar";
import { useEffect, useRef } from "react";
import { useData } from "./context/DataContext";

function App() {
  const { user } = useAuth();
  const { boards } = useData();
  const { boardId } = useParams();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  console.log("From app.tsx ", user, new Date().toISOString());

  useEffect(() => {
    if (!boardId && boards.length > 0 && !hasRedirected.current) {
      hasRedirected.current = true;
      const defaultBoard =
        boards.find((board) => board.is_default === true) || boards[0];
      navigate(`/${defaultBoard.id}`, { replace: true });
    }
  }, [boardId, boards, navigate]);

  return (
    <div
      data-app
      className="flex max-h-dvh min-h-dvh max-w-dvw min-w-dvw flex-col overflow-hidden"
    >
      <HeaderNav />
      <BoardsTabBar />
      <Outlet />
    </div>
  );
}

export default App;
