// ── HOW TO INTEGRATE: LoginPage.jsx → AdminDashboard ─────────────────────────
//
// Your LoginPage.jsx already calls useAuth() → login(email, password)
// After login, your auth hook sets the current user with a role.
// The App.jsx / router should check role and render AdminDashboard for admins.
//
// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE App.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";           // your existing login
import AdminDashboard from "./components/admin/AdminDashboard";

export default function App() {
  const { user, logout } = useAuth();

  // Not logged in → show login page
  if (!user) return <LoginPage />;

  // Logged in as admin → show admin dashboard
  if (user.role === "admin") {
    return (
      <AdminDashboard
        user={{
          firstName: user.firstName || user.first_name || "Admin",
          lastName:  user.lastName  || user.last_name  || "",
          email:     user.email,
          role:      user.role,
        }}
        onLogout={logout}
      />
    );
  }

  // Regular user → show your user-facing app
  return <YourUserApp />;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE useAuth hook (if you need to update it)
// ─────────────────────────────────────────────────────────────────────────────
// 
// import { useState, createContext, useContext } from "react";
// import axios from "axios";
//
// const AuthContext = createContext(null);
//
// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(() => {
//     try { return JSON.parse(localStorage.getItem("pawster_user") || "null"); }
//     catch { return null; }
//   });
//
//   const login = async (email, password) => {
//     // Your Spring Boot / PHP login endpoint:
//     const res = await axios.post("http://localhost:8000/api/auth/login", { email, password });
//     const userData = res.data; // { firstName, lastName, email, role, token }
//     localStorage.setItem("pawster_user", JSON.stringify(userData));
//     setUser(userData);
//   };
//
//   const logout = () => {
//     localStorage.removeItem("pawster_user");
//     document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//     setUser(null);
//   };
//
//   return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
// }
//
// export const useAuth = () => useContext(AuthContext);
//
// ─────────────────────────────────────────────────────────────────────────────
// FILE STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────
//
// src/
// ├── components/
// │   └── admin/
// │       ├── AdminDashboard.jsx   ← Main shell (sidebar + topbar + routing)
// │       ├── DashboardPanel.jsx   ← Feature 1: Overview stats & charts
// │       ├── AnimalsPanel.jsx     ← Feature 2: CRUD animals table
// │       ├── RequestsPanel.jsx    ← Feature 3 & 4: Adoptions + Rehome cards
// │       ├── SurveysPanel.jsx     ← Feature 5: Post-adoption surveys
// │       ├── GeoMapPanel.jsx      ← Feature 6: Leaflet geographic map
// │       ├── UsersPanel.jsx       ← Feature 7: User management table
// │       ├── ActivityPanel.jsx    ← Feature 8: Activity log
// │       ├── ProfilePanel.jsx     ← Bonus: Profile + password settings
// │       └── shared.jsx           ← Shared utilities, UI primitives, API helper
// ├── pages/
// │   └── LoginPage.jsx            ← Your existing login (unchanged)
// ├── hooks/
// │   └── useAuth.js               ← Auth hook (role-based)
// └── App.jsx                      ← Routes: login → admin dashboard OR user app