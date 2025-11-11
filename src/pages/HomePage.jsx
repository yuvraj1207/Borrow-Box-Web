import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";
import { Search, SlidersHorizontal, MapPin, Star } from "lucide-react";
import "./HomePage.css";

export default function HomePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Tools", "Electronics", "Gardening", "Sports"];

  // ✅ Fetch tools only when user is logged in
  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const fetchTools = async () => {
      try {
        const snapshot = await getDocs(collection(db, "tools"));
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const availableTools = fetched.filter(
          (t) => t.borrowed === false || t.borrowed === undefined
        );
        setTools(availableTools);
      } catch (err) {
        console.error("Error fetching tools:", err);
        alert("Failed to load tools. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, [currentUser, authLoading, navigate]);

  // ✅ Filtered + searched tools
  const filteredTools = tools.filter((t) => {
    const name = t.name?.toLowerCase() || "";
    const category = t.category?.toLowerCase() || "general";
    const matchesCategory =
      selectedCategory === "All" || category === selectedCategory.toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (authLoading) {
    return (
      <div className="home-center">
        <p>Loading user data...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="home-center">
        <p>
          Please <Link to="/login">login</Link> to view available tools.
        </p>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* ✅ Header */}
      <header className="home-header">
        <h2>Find what you need nearby.</h2>
        <div className="search-bar">
          <Search size={18} color="#606060" />
          <input
            type="text"
            placeholder="Search tools, gadgets, equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <SlidersHorizontal size={18} color="#606060" />
        </div>

        {/* ✅ Category Filters */}
        <div className="category-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`category-btn ${
                selectedCategory === cat ? "active" : ""
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* ✅ Tool List */}
      <main className="tool-list">
        {loading ? (
          <p className="text-center">Loading tools...</p>
        ) : filteredTools.length === 0 ? (
          <p className="text-center">No tools found.</p>
        ) : (
          filteredTools.map((tool) => {
            let imageUrl =
              tool.imageUrl ||
              "https://via.placeholder.com/90x90?text=No+Image";
            if (tool.imageBytes && Array.isArray(tool.imageBytes)) {
              try {
                const blob = new Blob([new Uint8Array(tool.imageBytes)], {
                  type: "image/jpeg",
                });
                imageUrl = URL.createObjectURL(blob);
              } catch (e) {
                console.warn("Invalid image bytes:", e);
              }
            }

            return (
              <div key={tool.id} className="tool-card">
                <div className="tool-card-top">
                  <div className="tool-image-wrapper">
                    <img
                      src={imageUrl}
                      alt={tool.name || "Tool"}
                      className="tool-image"
                    />
                    <span className="tool-category">
                      {tool.category || "General"}
                    </span>
                  </div>

                  <div className="tool-details">
                    <h4>{tool.name}</h4>
                    <p className="tool-rating">
                      <Star size={14} fill="#facc15" color="#facc15" />
                      <span> 4.5 (23 reviews)</span>
                    </p>
                    <p className="tool-location">
                      <MapPin size={14} />
                      <span> {tool.location || "Nearby"}</span>
                    </p>
                  </div>

                  <div className="tool-price">
                    <p>₹{tool.price || 0}</p>
                    <p>/day</p>
                    <Link to={`/tool/${tool.id}`} className="view-btn">
                      View
                    </Link>
                  </div>
                </div>

                <hr />

                <div className="tool-card-bottom">
                  <span>by {tool.ownerName || "Anonymous"}</span>
                  <span>{tool.pickup || "Pickup Hub A1"}</span>
                </div>
              </div>
            );
          })
        )}
      </main>

      <BottomNav />
    </div>
  );
}
