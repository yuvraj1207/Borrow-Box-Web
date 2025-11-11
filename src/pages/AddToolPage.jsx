import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "./AddToolPage.css";

export default function AddToolPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Tools");
  const [pickupName, setPickupName] = useState("");
  const [pickupDesc, setPickupDesc] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = ["Tools", "Electronics", "Gardening", "Sports", "Other"];

  // Redirect if user not logged in
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !pickupName) {
      alert("Please fill in all required fields!");
      return;
    }

    setLoading(true);
    try {
      let imageBytes = null;
      if (imageFile) {
        const arrayBuffer = await imageFile.arrayBuffer();
        imageBytes = Array.from(new Uint8Array(arrayBuffer));
      }

      await addDoc(collection(db, "tools"), {
        name,
        description,
        price: Number(price),
        category,
        pickupLocationName: pickupName,
        pickupLocationDesc: pickupDesc,
        ownerId: currentUser.uid,
        ownerName: currentUser.displayName || "Anonymous",
        imageBytes,
        available: true,
        createdAt: serverTimestamp(),
      });

      alert("✅ Tool listed successfully!");
      navigate("/");
    } catch (err) {
      console.error("Error adding tool:", err);
      alert("Failed to add tool. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Return null until user is available to prevent rendering blank
  if (!currentUser) return null;

  return (
    <div className="addtool-page">
      <h2>Add a Tool</h2>
      <form className="addtool-form" onSubmit={handleSubmit}>
        <label>
          Name <span className="required">*</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter tool name"
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your tool"
            rows="4"
          />
        </label>

        <label>
          Price per day (₹) <span className="required">*</span>
          <input
            type="number"
            min="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 100"
          />
        </label>

        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>

        <label>
          Pickup Location Name <span className="required">*</span>
          <input
            type="text"
            value={pickupName}
            onChange={(e) => setPickupName(e.target.value)}
            placeholder="Locker name or hub name"
          />
        </label>

        <label>
          Pickup Location Description
          <input
            type="text"
            value={pickupDesc}
            onChange={(e) => setPickupDesc(e.target.value)}
            placeholder="Optional description"
          />
        </label>

        <label>
          Image Upload
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </label>

        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" />
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Listing..." : "List Tool"}
        </button>
      </form>
    </div>
  );
}
