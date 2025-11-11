import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(userCred.user, { displayName: form.name });
      alert("✅ Account created successfully!");
      navigate("/login"); // navigate to login after signup
    } catch (err) {
      setError("Failed to create account: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Create Account</h2>
      <form onSubmit={handleSignup} style={formStyle}>
        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        {error && <p style={errorStyle}>{error}</p>}
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Creating..." : "Sign Up"}
        </button>
      </form>
      <p style={footerTextStyle}>
        Already have an account? <Link to="/login" style={linkStyle}>Login</Link>
      </p>
    </div>
  );
}

// ===== Inline Styles =====
const containerStyle = {
  maxWidth: "400px",
  margin: "80px auto",
  padding: "30px 20px",
  textAlign: "center",
  border: "1px solid #e0e0e0",
  borderRadius: "16px",
  backgroundColor: "#fff",
  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
  fontFamily: "system-ui, sans-serif",
};

const titleStyle = {
  marginBottom: "25px",
  fontSize: "28px",
  fontWeight: "600",
  color: "#111827",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const inputStyle = {
  padding: "12px 14px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "16px",
  outline: "none",
  transition: "border 0.2s",
};

const buttonStyle = {
  padding: "12px",
  background: "#4f46e5",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "500",
  transition: "background 0.2s",
};

const footerTextStyle = {
  marginTop: "20px",
  fontSize: "14px",
  color: "#6b7280",
};

const linkStyle = {
  color: "#4f46e5",
  fontWeight: "500",
  textDecoration: "none",
};

const errorStyle = {
  color: "red",
  fontSize: "13px",
  margin: "0",
};
