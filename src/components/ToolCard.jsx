import React from "react";
import { Link } from "react-router-dom";

export default function ToolCard({ tool }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: "1px solid #ccc",
        borderRadius: "12px",
        padding: "15px 20px",
        marginBottom: "12px",
        backgroundColor: "#fff",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: 0 }}>{tool.name}</h3>
        <p style={{ margin: "4px 0" }}>₹{tool.pricePerDay} / day</p>
        <p style={{ fontSize: "13px", color: "#777" }}>
          {tool.category || "General"}
        </p>
      </div>

      {/* ✅ View button on rightmost side */}
      <div style={{ marginLeft: "20px" }}>
        <Link
          to={`/tool/${tool.id}`}
          style={{
            display: "inline-block",
            backgroundColor: "#131416ff",
            color: "white",
            textDecoration: "none",
            padding: "8px 14px",
            borderRadius: "6px",
            fontWeight: "500",
          }}
        >
          View
        </Link>
      </div>
    </div>
  );
}
