import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setDisplayName(u.displayName || "");
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) return alert("Name cannot be empty");

    setUpdating(true);
    try {
      await updateProfile(auth.currentUser, { displayName });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>;

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "50px auto",
        padding: "20px",
        background: "#F8F9FA",
        borderRadius: "12px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#212529" }}>Settings</h2>

      {/* Display Name */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontWeight: "600", color: "#212529" }}>Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "6px",
            borderRadius: "6px",
            border: "1px solid #CED4DA",
            fontSize: "14px",
          }}
        />
      </div>

      {/* Email (read-only) */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontWeight: "600", color: "#212529" }}>Email</label>
        <input
          type="email"
          value={user.email}
          readOnly
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "6px",
            borderRadius: "6px",
            border: "1px solid #CED4DA",
            fontSize: "14px",
            background: "#E9ECEF",
          }}
        />
      </div>

      {/* Update Profile Button */}
      <button
        onClick={handleUpdateProfile}
        disabled={updating}
        style={{
          width: "100%",
          padding: "12px",
          background: updating ? "#ccc" : "#0d6efd",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontWeight: "600",
          fontSize: "16px",
          cursor: updating ? "not-allowed" : "pointer",
          marginBottom: "12px",
        }}
      >
        {updating ? "Updating..." : "Update Profile"}
      </button>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          width: "100%",
          padding: "12px",
          background: "#dc3545",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontWeight: "600",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}
