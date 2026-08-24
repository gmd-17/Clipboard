import { NavLink } from "react-router";
import "./App.css";

function App() {
  return (
    <>
      <div className="bg-primary text-text-primary">Hello world</div>
      <div className="">Hello world</div>
      <div className="">Hello world</div>
      <div className="">Hello world</div>
      <div className="">Hello world</div>
      <div className="">Hello world</div>
      <div className="">Hello world</div>
      <div className="">Hello world</div>
      <NavLink to={"/signin"}> signin</NavLink>
    </>
  );
}

export default App;
