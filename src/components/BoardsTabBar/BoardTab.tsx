import { useState } from "react";
import { NavLink } from "react-router";
import RoundCount from "./RoundCount";

const BoardTab = () => {
  const [isActive, setIsActive] = useState(false);

  const toggleIsActive = () => {
    setIsActive((prev) => !prev);
  };

  return (
    <NavLink
      to={"/"}
      onClick={toggleIsActive}
      className={`flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-semibold shadow-xs transition-all ${
        isActive
          ? "bg-accent text-accent-foreground border-accent"
          : "bg-secondary hover:bg-surface-hover border-border-subtle text-text-primary"
      }`}
    >
      Board
      <RoundCount classToggle={isActive} number={0} />
    </NavLink>
  );
};

export default BoardTab;
