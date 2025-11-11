import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase";

export default function BorrowFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tool, setTool] = useState(null);
  const [days, setDays] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // 🔹 Fetch tool details
  useEffect(() => {
    const fetchTool = async () => {
      try {
        const toolRef = doc(db, "tools", id);
        const toolSnap = await getDoc(toolRef);
        if (toolSnap.exists()) {
          const data = toolSnap.data();
          setTool({ id: toolSnap.id, ...data });

          if (data.imageBytes && Array.isArray(data.imageBytes)) {
            const blob = new Blob([new Uint8Array(data.imageBytes)], {
              type: "image/jpeg",
            });
            setImageUrl(URL.createObjectURL(blob));
          } else if (data.imageUrl) {
            setImageUrl(data.imageUrl);
          }

          setTotal(data.price || 0);
        }
      } catch (error) {
        console.error("Error fetching tool:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTool();
  }, [id]);

  // 🔹 Recalculate total when days change
  useEffect(() => {
    if (tool?.price) setTotal(days * tool.price);
  }, [days, tool]);

  // 🔹 Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // 💳 Handle Razorpay Payment
  const handleBorrow = async () => {
    if (!tool) return;
    if (!auth.currentUser) return alert("Please login first.");
    if (days < 1) return alert("Please enter valid number of days.");
    if (!agreeTerms)
      return alert("Please agree to the Terms & Conditions before proceeding.");

    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Check your internet connection.");
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_API_KEY, // ✅ Your Razorpay test key
      amount: total * 100, // Amount in paise
      currency: "INR",
      name: "Borrow Box",
      description: `Payment for ${tool.name}`,
      handler: async function (response) {
        setBorrowing(true);
        try {
          const user = auth.currentUser;

          // 1️⃣ Update tool document
          const toolRef = doc(db, "tools", id);
          await updateDoc(toolRef, {
            borrowed: true,
            borrowedDays: days,
            totalCost: total,
          });

          // 2️⃣ Add borrow history
          await addDoc(collection(db, "borrowHistory"), {
            userId: user.uid,
            userName: user.displayName || "Anonymous",
            toolId: id,
            toolName: tool.name,
            days,
            totalCost: total,
            returned: false,
            borrowedAt: serverTimestamp(),
            paymentId: response.razorpay_payment_id,
          });

          alert("✅ Payment successful and tool borrowed!");
          navigate("/profile");
        } catch (error) {
          console.error("Error borrowing tool:", error);
          alert("Something went wrong. Please try again.");
        } finally {
          setBorrowing(false);
        }
      },
      prefill: {
        name: auth.currentUser?.displayName || "User",
        email: auth.currentUser?.email,
      },
      theme: { color: "#111" },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  // 🕓 Loading / Not Found States
  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p>Loading tool details...</p>
      </div>
    );

  if (!tool)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p>Tool not found!</p>
      </div>
    );

  // 🧱 Main Render
  return (
    <div
      style={{
        padding: "32px",
        maxWidth: "700px",
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        color: "#111",
        backgroundColor: "#f7f7f7",
        minHeight: "100vh",
      }}
    >
      {/* 🔙 Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "transparent",
          color: "#111",
          border: "1px solid #ccc",
          padding: "8px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "20px",
          fontWeight: "500",
        }}
      >
        ← Back
      </button>

      {/* 🖼️ Tool Image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={tool.name}
          style={{
            width: "100%",
            height: "260px",
            objectFit: "cover",
            borderRadius: "12px",
            marginBottom: "24px",
            boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
          }}
        />
      )}

      {/* 📄 Tool Details */}
      <div
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ marginBottom: "10px", fontSize: "22px" }}>
          Borrow <span style={{ color: "#111" }}>{tool.name}</span>
        </h2>
        <p>
          <strong>Category:</strong> {tool.category}
        </p>
        <p>
          <strong>Price/Day:</strong> ₹{tool.price}
        </p>
        <p>
          <strong>Location:</strong> {tool.location}
        </p>
      </div>

      {/* 🧾 Borrow Form */}
      <div
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <label htmlFor="days" style={{ display: "block", marginBottom: "8px" }}>
          <strong>Number of Days:</strong>
        </label>
        <input
          id="days"
          type="number"
          min="1"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginBottom: "16px",
            fontSize: "15px",
          }}
        />

        <p style={{ marginBottom: "12px", fontWeight: "500" }}>
          💰 Total Cost:{" "}
          <span style={{ color: "#16a34a", fontWeight: "600" }}>₹{total}</span>
        </p>

        {/* ✅ Terms & Conditions */}
        <label style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            style={{ marginRight: "8px" }}
          />
          <span>
            I agree to the{" "}
            <a
              href="/terms"
              style={{ color: "#2563eb", textDecoration: "underline" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms & Conditions
            </a>
          </span>
        </label>

        <button
          onClick={handleBorrow}
          disabled={borrowing || !agreeTerms}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: !agreeTerms ? "#999" : "#111",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: !agreeTerms ? "not-allowed" : "pointer",
            fontWeight: "600",
            transition: "background 0.3s ease",
          }}
        >
          {borrowing ? "Processing..." : "Confirm & Pay"}
        </button>
      </div>
    </div>
  );
}
