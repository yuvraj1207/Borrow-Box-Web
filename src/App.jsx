import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import Profile from "./pages/Profile.jsx";
import AddToolPage from "./pages/AddToolPage.jsx";
import ToolDetailPage from "./pages/ToolDetailPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import BorrowFormPage from "./pages/BorrowFormPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import TermsPage from "./pages/TermsPage.jsx";

function App() {
  return (
    <Routes>
      {/* Main Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/add-tool" element={<AddToolPage />} />
      <Route path="/tool/:id" element={<ToolDetailPage />} />

      {/* Auth Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/settings" element={<SettingsPage />} />


      {/* Borrow Flow */}
      <Route path="/borrow/:id" element={<BorrowFormPage />} />
      <Route path="/terms" element={<TermsPage />} />

      {/* Catch-all 404 Page */}
      <Route
        path="*"
        element={
          <div style={{ textAlign: "center", marginTop: "50px", fontSize: "20px", color: "#555" }}>
            404 - Page not found
          </div>
        }
      />
    </Routes>
  );
}

export default App;


