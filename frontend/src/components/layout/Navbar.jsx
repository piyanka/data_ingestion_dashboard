import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Menu,
  X,
  Building2,
  LayoutDashboard,
  Upload,
  FileSearch,
} from "lucide-react";

export default function Navbar({
  routes,
  organizations,
  activeOrganizationId,
  onOrganizationChange,
  activeOrganization,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-left">
          <button
            className="menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="brand">
            <div className="brand-mark">BE</div>

            <div className="brand-text">
              <h2>Breathe ESG</h2>
              <p>Analyst Workspace</p>
            </div>
          </div>
        </div>

        <div className="navbar-right">
          <label className="org-picker">
            <Building2 size={16} />

            <select
              value={activeOrganizationId}
              onChange={(event) =>
                onOrganizationChange(event.target.value)
              }
            >
              {organizations.length === 0 ? (
                <option value="">No organizations</option>
              ) : null}

              {organizations.map((organization) => (
                <option
                  key={organization.id}
                  value={organization.id}
                >
                  {organization.name}
                </option>
              ))}
            </select>
          </label>

          <div className="profile-chip">
            {getOrganizationInitials(
              activeOrganization?.name || "Analyst"
            )}
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-mark">BE</div>

            <div className="brand-text">
              <h2>Breathe ESG</h2>
              <p>Dashboard</p>
            </div>
          </div>

          <button
            className="close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-links">
          {routes.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              {index === 0 && <LayoutDashboard size={18} />}
              {index === 1 && <Upload size={18} />}
              {index === 2 && <FileSearch size={18} />}

              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-chip large">
            {getOrganizationInitials(
              activeOrganization?.name || "Analyst"
            )}
          </div>

          <div>
            <strong>
              {activeOrganization?.name || "Analyst"}
            </strong>

            <p>Active Organization</p>
          </div>
        </div>
      </aside>
    </>
  );
}

function getOrganizationInitials(name) {
  const parts = String(name || "")
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "AN";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}