/**
 * Campus Sphere — Application Router
 * =====================================
 * Defines all page routes for the application.
 */

import { createBrowserRouter } from "react-router-dom";

// Layout
import MainLayout from "../layouts/MainLayout";

// Pages
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Chat from "../pages/Chat";
import Cafe from "../pages/Cafe";
import Clubs from "../pages/Clubs";
import Events from "../pages/Events";
import Library from "../pages/Library";
import OpenElectives from "../pages/OpenElectives";
import LostFound from "../pages/LostFound";
import IRO from "../pages/IRO";
import Profile from "../pages/Profile";
import AdminPanel from "../pages/AdminPanel";
import NotFound from "../pages/NotFound";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/app",
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "chat", element: <Chat /> },
      { path: "cafe", element: <Cafe /> },
      { path: "clubs", element: <Clubs /> },
      { path: "events", element: <Events /> },
      { path: "library", element: <Library /> },
      { path: "open-electives", element: <OpenElectives /> },
      { path: "lost-found", element: <LostFound /> },
      { path: "iro", element: <IRO /> },
      { path: "profile", element: <Profile /> },
      { path: "admin", element: <AdminPanel /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
