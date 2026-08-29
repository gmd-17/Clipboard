import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import AuthForm from "./components/AuthForm.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { DataProvider } from "./context/DataContext.tsx";
import Board from "./components/Board/Board.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <div className="flex h-full w-full items-center justify-center text-gray-500">
            <h3>Please select a board from the tab bar above.</h3>
          </div>
        ),
      },
      { path: "/:boardId", element: <Board /> },
    ],
  },
  {
    path: "/signin",
    element: <AuthForm />,
  },
  {
    path: "/signup",
    element: <AuthForm />,
  },
  {
    path: "/forgot",
    element: <div>not found</div>,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <DataProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </DataProvider>
    </AuthProvider>
  </StrictMode>,
);
