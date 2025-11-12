import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase"; // Firebase Firestore instance
import { useAuth } from "../context/AuthContext"; // Custom auth context
import { FaArrowLeft, FaStar, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";
import "./ToolDetailPage.css";

export default function ToolDetailPage() {
  const { id } = useParams(); // Get tool id from URL
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [tool, setTool] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  // Fetch tool details from Firestore
  useEffect(() => {
    const fetchTool = async () => {
      try {
        const snap = await getDoc(doc(db, "tools", id));
        if (snap.exists()) {
          const data = snap.data();
          setTool(data);

          // Handle image bytes (if stored as binary) or URL
          if (data.imageBytes) {
            const blob = new Blob([new Uint8Array(data.imageBytes)], { type: "image/jpeg" });
            setImageUrl(URL.createObjectURL(blob));
          } else {
            setImageUrl(data.imageUrl || "");
          }
        }
      } catch (err) {
        console.error("Error fetching tool:", err);
      }
    };
    fetchTool();
  }, [id]);

  // Delete tool (only for owner)
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    await deleteDoc(doc(db, "tools", id));
    alert("Tool deleted successfully!");
    navigate("/"); // Redirect after deletion
  };

  // Navigate to borrow page
  const handleBorrow = () => navigate(`/borrow/${id}`);

  // Show loading if tool data not yet fetched
  if (!tool) return <div className="loading">Loading...</div>;

  // Check if current user is the owner of the tool
  const isOwner = currentUser && currentUser.uid === tool.ownerId;

  return (
    <div className="tool-page">

      {/* Header with back button */}
      <header className="tool-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft size={20} />
        </button>
        <h1>Item Details</h1>
        <div style={{ width: "24px" }}></div> {/* Spacer for alignment */}
      </header>

      {/* Scrollable content */}
      <main className="tool-content">

        {/* Top Image with owner overlay */}
        <div className="tool-image-box">
          {imageUrl ? (
            <img src={imageUrl} alt={tool.name} />
          ) : (
            <div className="no-image">No Image Available</div>
          )}

          {/* Owner badge overlay */}
          <div className="owner-badge">
            <div className="owner-avatar"></div>
            <span>{tool.ownerName || "Lender"}</span>
          </div>
        </div>

        {/* Title and Price */}
        <div className="top-row">
          <h2>{tool.name}</h2>
          <div className="price-box">
            <p className="price">₹{tool.price || 0}</p>
            <p className="perday">per day</p>
          </div>
        </div>

        {/* Tags / categories */}
        <div className="tag-row">
          <span className="tag">Tools</span>
          <span className="tag">AI Recommended</span>
        </div>

        {/* Rating and Distance */}
        <div className="rating-row">
          <div className="rating-item">
            <FaStar className="star" /> {tool.rating || "4.8"} ({tool.reviews || "42"} reviews)
          </div>

          <div className="rating-item">
            <FaMapMarkerAlt /> {tool.distance || "0.3 km"} away
          </div>
        </div>

        {/* Description */}
        <section>
          <h3>Description</h3>
          <p className="desc">{tool.description}</p>
        </section>

        {/* Pickup Location */}
        <section>
          <h3>Pickup Location</h3>
          <div className="pickup-card">
            <div className="pickup-left">
              <FaMapMarkerAlt className="pickup-icon" />
              <div>
                <p className="pickup-title">{tool.pickupLocationName || "Downtown Hub - Locker A3"}</p>
                <p className="pickup-sub">{tool.pickupLocationDesc || "Smart locker with QR access"}</p>
              </div>
            </div>

            <div className="pickup-status">
              <span className="dot"></span> Available
            </div>
          </div>
        </section>

        {/* Lender section (to be updated with proper details) */}
        <section>
          <h3>Lender</h3>
          <p className="lender-desc">
            Contact details or more information about the owner can go here.
          </p>
        </section>

        {/* Action Buttons */}
        <div className="action-row">
          {isOwner ? (
            <button className="delete-btn" onClick={handleDelete}>Delete Tool</button>
          ) : (
            <button
              className={`borrow-btn ${!tool.available ? "disabled" : ""}`}
              onClick={handleBorrow}
              disabled={!tool.available}
            >
              {tool.available ? "Borrow Tool" : "Not Available"}
            </button>
          )}
        </div>

      </main>

      {/* Sticky Footer (blue button commented out) */}
      <footer className="tool-footer">
        {/* <button className="book-btn">
          <FaCalendarAlt /> Book Now
        </button> */}
        <p className="verify-msg">You'll verify item condition before pickup</p>
      </footer>

    </div>
  );
}
