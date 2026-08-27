import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import AuthForm from "./components/AuthForm.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { DataProvider } from "./context/DataContext.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
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
