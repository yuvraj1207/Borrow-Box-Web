import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { FaArrowLeft, FaStar, FaMapMarkerAlt } from "react-icons/fa";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./ToolDetailPage.css";

// Mapbox Access Token (from .env)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;


// Haversine formula to calculate distance in km
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d.toFixed(2); // km with 2 decimals
}

export default function ToolDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [tool, setTool] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const fetchTool = async () => {
      try {
        const snap = await getDoc(doc(db, "tools", id));
        if (snap.exists()) {
          const data = snap.data();
          setTool(data);
          if (data.imageBytes) {
            const blob = new Blob([new Uint8Array(data.imageBytes)], {
              type: "image/jpeg",
            });
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

    // Get user current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => console.warn("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
    }
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    await deleteDoc(doc(db, "tools", id));
    alert("Tool deleted successfully!");
    navigate("/");
  };

  const handleBorrow = () => navigate(`/borrow/${id}`);

  if (!tool) return <div className="loading">Loading...</div>;

  const isOwner = currentUser && currentUser.uid === tool.ownerId;

  // Tool location fallback
  const toolLocation = {
     latitude: tool.pickupLat || 15.5975,    // 15°35'51" N → 15 + 35/60 + 51/3600 ≈ 15.5975
  longitude: tool.pickupLng || 73.7942,
  };

  // Map center: midpoint between user & tool
  const mapCenter = userLocation
    ? {
        latitude: (toolLocation.latitude + userLocation.latitude) / 2,
        longitude: (toolLocation.longitude + userLocation.longitude) / 2,
      }
    : toolLocation;

  // Dynamic distance
  const distanceKm =
    userLocation &&
    getDistanceFromLatLonInKm(
      toolLocation.latitude,
      toolLocation.longitude,
      userLocation.latitude,
      userLocation.longitude
    );

  return (
    <div className="tool-page">
      {/* Header */}
      <header className="tool-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft size={20} />
        </button>
        <h1>Item Details</h1>
        <div style={{ width: "24px" }}></div>
      </header>

      <main className="tool-content">
        {/* Tool Image */}
        <div className="tool-image-box">
          {imageUrl ? (
            <img src={imageUrl} alt={tool.name} />
          ) : (
            <div className="no-image">No Image Available</div>
          )}
          <div className="owner-badge">
            <div className="owner-avatar"></div>
            <span>{tool.ownerName || "Lender"}</span>
          </div>
        </div>

        {/* Title + Price */}
        <div className="top-row">
          <h2>{tool.name}</h2>
          <div className="price-box">
            <p className="price">₹{tool.price || 0}</p>
            <p className="perday">per day</p>
          </div>
        </div>

        {/* Tags */}
        <div className="tag-row">
          <span className="tag">Tools</span>
        </div>

        {/* Rating + Distance */}
        <div className="rating-row">
          <div className="rating-item">
            <FaStar className="star" /> {tool.rating || "4.3"} (
            {tool.reviews || "33"} reviews)
          </div>
          {distanceKm && (
            <div className="rating-item">
              <FaMapMarkerAlt /> {distanceKm} km away
            </div>
          )}
        </div>

        {/* Description */}
        <section>
          <h3>Description</h3>
          <p className="desc">{tool.description}</p>
        </section>

        {/* Pickup Location + Map */}
        <section>
          <h3>Pickup Location</h3>
          <div className="pickup-card">
            <div className="pickup-left">
              <FaMapMarkerAlt className="pickup-icon" />
              <div>
                <p className="pickup-title">
                  {tool.pickupLocationName || "Downtown Hub - Locker A3"}
                </p>
                <p className="pickup-sub">
                  {tool.pickupLocationDesc || "Smart locker with QR access"}
                </p>
              </div>
            </div>
            <div className="pickup-status">
              <span className="dot"></span> Available
            </div>
          </div>

          {/* Mapbox Map */}
          <div className="map-container">
            <Map
              initialViewState={{
                longitude: mapCenter.longitude,
                latitude: mapCenter.latitude,
                zoom: 12,
              }}
              style={{
                width: "100%",
                height: "300px",
                borderRadius: "12px",
                marginTop: "12px",
              }}
              mapStyle="mapbox://styles/mapbox/streets-v11"
              mapboxAccessToken={MAPBOX_TOKEN}
            >
              {/* Tool Marker */}
              <Marker
                longitude={toolLocation.longitude}
                latitude={toolLocation.latitude}
                color="#198754"
              />
              {/* User Marker */}
              {userLocation && (
                <Marker
                  longitude={userLocation.longitude}
                  latitude={userLocation.latitude}
                  color="#0d6efd"
                />
              )}
            </Map>
          </div>
        </section>

        {/* Lender Details */}
        <section>
          <h3>Lender</h3>
          <p className="lender-desc">
            {tool.ownerContact || "Contact details not provided"}
          </p>
        </section>

        {/* Action Buttons */}
        <div className="action-row">
          {isOwner ? (
            <button className="delete-btn" onClick={handleDelete}>
              Delete Tool
            </button>
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

      {/* Footer */}
      <footer className="tool-footer">
        <p className="verify-msg">You'll verify item condition before pickup</p>
      </footer>
    </div>
  );
}
