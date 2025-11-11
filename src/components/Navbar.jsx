// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="container nav">
      <h2 style={{ margin:0 }}>BorrowBox</h2>
      <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
        <Link to="/">Home</Link>
        <Link to="/add-tool">Add Tool</Link>
        <Link to="/profile">Profile</Link>
      </div>
    </div>
  );
}
