import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
  const { isAuthed, user, logout } = useAuth();

  if (!isAuthed) return null;

  const isAdmin = user.role === "ADMIN" || user.role === "RESEARCHER";

  const publicLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/evaluation", label: "Evaluation" },
    { to: "/messaging", label: "Messaging" },
    { to: "/contact", label: "Contact Us" },
  ];

  const adminLinks = [
    { to: "/admin/users", label: "Users" },
    { to: "/admin/evaluations", label: "Evaluations" },
    { to: "/admin/maintenance", label: "Maintenance" },
    { to: "/admin/contact", label: "Contact Info" },
  ];

  return (
    <div className="navbar bg-base-200 sticky top-0 z-10 border-b border-base-300">
      <div className="container mx-auto flex justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Eval Portal</span>

          <ul className="menu menu-horizontal px-1 gap-1">
            {publicLinks.map((l) => (
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

            {isAdmin && (
              <li>
                <details>
                  <summary>Admin</summary>
                  <ul className="p-2 bg-base-100 rounded-t-none border border-base-200 shadow-lg z-20 min-w-[200px]">
                    {adminLinks.map((l) => (
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
                </details>
              </li>
            )}
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
