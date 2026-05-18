import { createBrowserRouter } from "react-router-dom";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Dashboard from "./features/dashboard/pages/Dashboard";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import LiveInterview from "./features/live-interview/pages/LiveInterview";

// This router maps website URLs to React page components.
// Protected pages require a logged-in user before they are shown.
export const router = createBrowserRouter([
  {
    // The dashboard is the home page after login.
    path: "/",
    element: (
      <Protected>
        <Dashboard />
      </Protected>
    ),
  },
  {
    // This page lets users upload a resume and paste a job description.
    path: "/prepare",
    element: (
      <Protected>
        <Home />
      </Protected>
    ),
  },
  {
    // This page runs the voice-style live interview practice flow.
    path: "/live-interview",
    element: (
      <Protected>
        <LiveInterview />
      </Protected>
    ),
  },
  {
    // This page shows one saved AI-generated interview report.
    path: "/interview/:interviewId",
    element: (
      <Protected>
        <Interview />
      </Protected>
    ),
  },
  {
    // Public login page.
    path: "/login",
    element: <Login />,
  },
  {
    // Public registration page.
    path: "/register",
    element: <Register />,
  },
]);
