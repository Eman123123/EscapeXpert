// Sidebar.js
import React from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({ user }) {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Menu</span>
      </div>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className="nav-item">
          <i className="fas fa-home"></i>
          Dashboard Home
        </Link>

        <Link to="/profile" className="nav-item">
          <i className="fas fa-user"></i>
          View Profile
        </Link>

        <Link to="/settings" className="nav-item">
          <i className="fas fa-cog"></i>
          Settings
        </Link>
      </nav>
    </aside>
  );
}
