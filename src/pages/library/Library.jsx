import React from "react";
import MobileFooter from "../../components/mobile-footer/MobileFooter";
import "./Library.css";

export default function Library() {
  return (
    <div className="library-screen">
      <div className="library-header">
        <h1>library</h1>
        <p className="library-subtitle">your identified songs and saved stories</p>
      </div>

      <div className="library-content-container">
        <div className="library-card">
          <h3>saved songs</h3>
          <p>Your history of identified songs and custom AI DJ commentary will live here.</p>
        </div>
      </div>

      <MobileFooter />
    </div>
  );
}