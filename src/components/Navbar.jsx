import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
  const { isAuthed, user, logout } = useAuth();

  if (!isAuthed) return null;

  const isAdmin = user.role === "ADMIN" || user.role === "RESEARCHER";

  const links = [
    { to: "/dashboard", label: "Dashboard", show: true },
    { to: "/evaluation", label: "Evaluation", show: true },
    { to: "/messaging", label: "Messaging", show: true },
    { to: "/contact", label: "Contact Us", show: true },
    { to: "/admin/users", label: "User Management", show: isAdmin },
    { to: "/admin/evaluations", label: "Evaluation Management", show: isAdmin },
    { to: "/admin/maintenance", label: "Maintenance Management", show: isAdmin },
  ].filter((x) => x.show);

  return (
    <div className="navbar bg-base-100 sticky top-0 z-10 border-b border-base-300">
      <div className="container mx-auto flex justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Eval Portal</span>

          <ul className="menu menu-horizontal px-1 gap-1">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    isActive ? "active font-semibold" : ""
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <span className="badge badge-outline text-xs">
            {user.username} • {user.role}
          </span>

          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
