import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react"; // ✅ Generate QR code
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [borrowedTools, setBorrowedTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState(null); // Track which QR to show
  const [selectedToolId, setSelectedToolId] = useState(null); // Track which tool to return

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

  // Show QR modal for tool verification
  const handleShowQR = (toolId) => {
    setSelectedQR(toolId);
    setSelectedToolId(toolId);
  };

  // Mark tool as returned after QR verification
  const handleReturnConfirmed = async () => {
    if (!selectedToolId) return;
    try {
      await updateDoc(doc(db, "borrowHistory", selectedToolId), { returned: true });
      alert("Tool marked as returned successfully!");
      fetchBorrowedTools(user.uid);
      setSelectedQR(null);
      setSelectedToolId(null);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update tool status.");
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  return (
    <div className="profile-container">
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

      {/* ✅ QR Modal */}
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
    </div>
  );
}
