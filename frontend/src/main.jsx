import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app.routes";
import { AuthProvider } from "./features/auth/auth.context";
import "./style.scss";

// This block is the React entry point.
// It finds the <div id="root"> in index.html and places the whole website inside it.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* AuthProvider shares login state with every page in the website. */}
    <AuthProvider>
      {/* RouterProvider decides which page component appears for the current URL. */}
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
