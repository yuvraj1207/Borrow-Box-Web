import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function BottomNav() {
  const { pathname } = useLocation();

  const navStyle = (path) => ({
    flex: 1,
    padding: "10px",
    textAlign: "center",
    background: pathname === path ? "#4f46e5" : "#fff",
    color: pathname === path ? "#fff" : "#333",
    borderTop: "1px solid #ddd",
    textDecoration: "none",
  });

  return (
    <div
      style={{
        display: "flex",
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        boxShadow: "0 -1px 6px rgba(0,0,0,0.1)",
      }}
    >
      <Link to="/" style={navStyle("/")}>
        🏠 Home
      </Link>
      <Link to="/add-tool" style={navStyle("/add-tool")}>
        ➕ Add Tool
      </Link>
      <Link to="/profile" style={navStyle("/profile")}>
        👤 Profile
      </Link>
    </div>
  );
}
