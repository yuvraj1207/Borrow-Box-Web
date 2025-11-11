import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx"; // ✅ ensure correct path
import "./index.css";

// ✅ Safely mount React root
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("❌ Root element not found. Make sure <div id='root'></div> exists in index.html");
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  );
}
