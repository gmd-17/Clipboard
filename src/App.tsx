import { Link } from "react-router";
import "./App.css";
import { useAuth } from "./context/AuthContext";
import HeaderNav from "./components/HeaderNav";

function App() {
  const { user, signOut } = useAuth();

  console.log(user, new Date().toISOString());

  return (
    <>
      <HeaderNav />
      <div>app</div>
      <button className="p2 m-1 rounded border p-2" onClick={signOut}>
        SignOut
      </button>
      <Link to={"/signin"}> signin</Link>
    </>
  );
}

export default App;
