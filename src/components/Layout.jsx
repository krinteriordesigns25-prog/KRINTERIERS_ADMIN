import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Layout() {
  const { email, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const link = ({ isActive }) => `side-link ${isActive ? "active" : ""}`;
  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="side-brand">
          <strong>KRinterior</strong>
          <small>CMS</small>
        </div>
        <nav onClick={() => setOpen(false)}>
          {/* <NavLink end to="/" className={link}>
            <i className="bi">▦</i> Dashboard
          </NavLink> */}
          <NavLink to="/hero" className={link}>
            <i class="bi bi-laptop" />
            Hero Section
          </NavLink>
          <NavLink to="/review" className={link}>
            <i class="bi bi-laptop" />
            Review
          </NavLink>
          <NavLink to="/projects" className={link}>
            <i class="bi bi-laptop" />
            Works
          </NavLink>
          <NavLink to="/design" className={link}>
            <i class="bi bi-laptop" />
            Design
          </NavLink>
          {/* <NavLink to="/faq" className={link}>
            <i class="bi bi-laptop" />
            FAQ
          </NavLink>
          <NavLink to="/pages" className={link}>
            <i className="bi">▤</i> Pages
          </NavLink>
          <NavLink to="/menus" className={link}>
            <i className="bi">☰</i> Menus
          </NavLink> */}
          <NavLink to="/account" className={link}>
            <i className="bi">⚙</i> Account
          </NavLink>
        </nav>
        <div className="side-foot">
          <span title={email}>{email}</span>
          <button className="btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button
            className="burger"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>
          <span>Website content manager</span>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
