import { Link } from "react-router";
import "./App.css";
import { useAuth } from "./context/AuthContext";
import HeaderNav from "./components/HeaderNav";
import BoardsTabBar from "./components/BoardsTabBar/BoardsTabBar";

function App() {
  const { user, signOut } = useAuth();

  console.log(user, new Date().toISOString());

  return (
    <div
      data-app
      className="max-h-dvh min-h-dvh max-w-dvw min-w-dvw overflow-hidden"
    >
      <HeaderNav />
      <BoardsTabBar />
      <div>app</div>
      <button className="p2 m-1 rounded border p-2" onClick={signOut}>
        SignOut
      </button>
      <Link to={"/signin"}> signin</Link>
    </div>
  );
}

export default App;
