import { LoaderCircleIcon } from "lucide-react"; // Or your icon package
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  MoonIcon,
  SettingsIcon,
  Share2Icon,
  StickyNotesIcon,
  SunIcon,
  UserRoundIcon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { NavLink } from "react-router";

const HeaderNav = () => {
  const { user: authUser, loading: authLoading } = useAuth();

  // const [user, setUser] = useState<User | null>(authUser ?? null);
  const { isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(authLoading);

  // useEffect(() => {}, []);

  useEffect(() => {
    setUser(authUser);
    setLoading(authLoading);
    console.log("IsDark", isDark);
    console.log("authLoading", authLoading);
  }, [authUser, authLoading]);

  return (
    <>
      <header className="bg-primary text-text-primary flex pr-2 transition-colors">
        {/* Hero */}
        <NavLink
          to={"/"}
          className="mr-auto flex items-center gap-2 p-4 text-2xl font-bold"
        >
          <span className="bg-accent rounded-2xl p-3">
            <StickyNotesIcon stroke="var(--color-accent-foreground)" />
          </span>
          <p>Clipboard</p>
        </NavLink>

        {/* Rest Navbar components */}
        <nav className="flex gap-1.5 self-center">
          <button
            onClick={() => {
              alert("Implement this");
            }}
            className="hover:bg-surface-hover flex cursor-pointer gap-1 rounded-xl p-2"
          >
            <span>
              <Share2Icon />
            </span>
            <p>Share</p>
          </button>
          <div className="border-border-subtle mx-0.5 my-1.5 border-l-2"></div>
          <button
            onClick={toggleTheme}
            className="hover:bg-surface-hover flex cursor-pointer gap-1 rounded-xl p-2"
          >
            <span>{isDark ? <SunIcon /> : <MoonIcon />}</span>
            {/* <p>Theme</p> */}
          </button>
          <button
            onClick={() => {
              alert("Implement this");
            }}
            className="hover:bg-surface-hover flex cursor-pointer gap-1 rounded-xl p-2"
          >
            <span>
              <SettingsIcon />
            </span>
            {/* <p>Settings</p> */}
          </button>

          <button
            disabled={loading}
            className="bg-surface hover:bg-surface-hover flex cursor-pointer gap-1 rounded-xl p-2 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => alert("Implement this")}
          >
            <span>
              {/* Show spinner when loading, otherwise show user icon */}
              {loading ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <UserRoundIcon />
              )}
            </span>
            <p>{loading ? "Loading..." : user ? "Sign Out" : "Sign in"}</p>
          </button>
        </nav>
      </header>
    </>
  );
};

export default HeaderNav;
