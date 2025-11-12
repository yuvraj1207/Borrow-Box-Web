import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react"; // ✅ Generate QR code
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [borrowedTools, setBorrowedTools] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for QR verification
  const [selectedQR, setSelectedQR] = useState(null); // Track which QR modal to show
  const [selectedToolId, setSelectedToolId] = useState(null); // Track which tool is being returned

  // States for Review Form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [toolRating, setToolRating] = useState(5);
  const [lenderRating, setLenderRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // ✅ Fetch user on auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        await fetchBorrowedTools(u.uid);
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // ✅ Fetch borrow history
  const fetchBorrowedTools = async (userId) => {
    try {
      const q = query(collection(db, "borrowHistory"), where("userId", "==", userId));
      const snapshot = await getDocs(q);

      const dataPromises = snapshot.docs.map(async (d) => {
        const history = { id: d.id, ...d.data() };
        try {
          const toolSnap = await getDoc(doc(db, "tools", history.toolId));
          if (toolSnap.exists()) {
            history.toolData = toolSnap.data();
          }
        } catch (err) {
          console.error("Error fetching tool info:", err);
        }
        return history;
      });

      const data = await Promise.all(dataPromises);
      setBorrowedTools(data);
    } catch (err) {
      console.error("Error fetching borrow history:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Show QR modal for return verification
  const handleShowQR = (toolId) => {
    setSelectedQR(toolId);
    setSelectedToolId(toolId);
  };

  // ✅ Handle tool return after QR verification
  const handleReturnConfirmed = async () => {
    if (!selectedToolId) return;

    try {
      await updateDoc(doc(db, "borrowHistory", selectedToolId), { returned: true });
      alert("Tool marked as returned successfully!");
      fetchBorrowedTools(user.uid);

      // Close QR modal
      setSelectedQR(null);

      // ✅ Open review form modal
      setShowReviewForm(true);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update tool status.");
    }
  };

  // ✅ Submit review for lender + tool
  const submitReview = async () => {
    try {
      const selectedHistory = borrowedTools.find((h) => h.id === selectedToolId);
      if (!selectedHistory) return;

      await addDoc(collection(db, "reviews"), {
        toolId: selectedHistory.toolId,
        toolName: selectedHistory.toolData?.name || "Tool",
        lenderId: selectedHistory.toolData?.ownerId,
        borrowerId: user.uid,
        toolRating,
        lenderRating,
        comment: reviewComment,
        timestamp: serverTimestamp(),
      });

      alert("Review submitted successfully!");

      // Reset review form
      setShowReviewForm(false);
      setReviewComment("");
      setToolRating(5);
      setLenderRating(5);
      setSelectedToolId(null);

      // Refresh borrow history
      fetchBorrowedTools(user.uid);
    } catch (err) {
      console.error("Failed to submit review:", err);
      alert("Failed to submit review.");
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header" style={{ position: "relative" }}>
        <h2>{user?.displayName || "User Profile"}</h2>
        <p>{user?.email}</p>
        <p>
          Member since:{" "}
          {user?.metadata?.creationTime
            ? new Date(user.metadata.creationTime).toLocaleDateString()
            : "N/A"}
        </p>

        {/* ⚙️ Settings Icon */}
        <Link
          to="/settings"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            fontSize: "20px",
            textDecoration: "none",
            color: "#4f46e5",
          }}
          title="Settings"
        >
          ⚙️
        </Link>
      </div>

      {/* Borrow History */}
      <div className="borrowed-section">
        <h3>Borrow History</h3>
        {borrowedTools.length === 0 ? (
          <p>No borrowed tools yet.</p>
        ) : (
          <div className="borrowed-grid">
            {borrowedTools.map((history) => (
              <div key={history.id} className="borrowed-card">
                <h4>
                  <Link
                    to={`/tool/${history.toolId}`}
                    style={{ textDecoration: "none", color: "#111" }}
                  >
                    {history.toolName}
                  </Link>
                </h4>
                <p>Days: {history.days}</p>
                <p>Total: ₹{history.totalCost}</p>
                <p>Status: {history.returned ? "Returned" : "Borrowed"}</p>

                {/* Return Tool Button */}
                {!history.returned && (
                  <button
                    onClick={() => handleShowQR(history.id)}
                    className="return-btn"
                  >
                    Return Tool
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {selectedQR && (
        <div className="qr-modal">
          <div className="qr-content">
            <h3>Scan this QR to verify return</h3>
            <QRCodeCanvas
              value={`https://yourapp.web.app/verify/${selectedQR}`}
              size={200}
            />
            <p>Once verified, click below to confirm return:</p>
            <button onClick={handleReturnConfirmed} className="return-btn">
              Confirm Return
            </button>
            <button
              onClick={() => setSelectedQR(null)}
              className="close-qr-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="review-modal">
          <div className="review-content">
            <h3>Leave a Review</h3>

            <label>Tool Rating:</label>
            <select value={toolRating} onChange={(e) => setToolRating(Number(e.target.value))}>
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Good</option>
              <option value={3}>3 - Average</option>
              <option value={2}>2 - Poor</option>
              <option value={1}>1 - Terrible</option>
            </select>

            <label>Lender Rating:</label>
            <select
              value={lenderRating}
              onChange={(e) => setLenderRating(Number(e.target.value))}
            >
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Good</option>
              <option value={3}>3 - Average</option>
              <option value={2}>2 - Poor</option>
              <option value={1}>1 - Terrible</option>
            </select>

            <label>Comments:</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Add your comments..."
            />

            <button onClick={submitReview} className="submit-review-btn">
              Submit Review
            </button>
            <button
              onClick={() => setShowReviewForm(false)}
              className="close-review-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
