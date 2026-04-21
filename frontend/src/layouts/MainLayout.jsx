/**
 * Campus Sphere — Main Layout
 * =============================
 * Wraps all authenticated pages with sidebar + header.
 */

import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar — will be built in Phase 8 */}
      <aside style={{ width: 260, background: "#0f172a", color: "#fff", padding: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>🎓 Campus Sphere</h2>
        <nav>
          <p>📊 Dashboard</p>
          <p>💬 AI Chat</p>
          <p>☕ Cafe</p>
          <p>🤝 Clubs</p>
          <p>🏆 Events</p>
          <p>📚 Library</p>
          <p>📖 Open Electives</p>
          <p>🔍 Lost & Found</p>
          <p>🌍 IRO Portal</p>
          <p>👤 Profile</p>
          <p>🛠️ Admin</p>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, background: "#f8fafc", padding: "2rem" }}>
        <Outlet />
      </main>
    </div>
  );
}
