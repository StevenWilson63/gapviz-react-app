import React from "react";
import MobileFooter from "../../components/mobile-footer/MobileFooter";
import "./Dj.css";

export default function Dj() {
  return (
    <div className="dj-screen">
      <div className="dj-header">
        <h1>dj studio</h1>
        <p className="dj-subtitle">build, customize, and control your AI DJs</p>
      </div>

      <div className="dj-content-container">
        <div className="dj-card">
          <h3>active dj persona</h3>
          <p>Configure your custom host, voice tone, and commentary style.</p>
          <button className="gv-button">customize dj</button>
        </div>
      </div>

      <MobileFooter />
    </div>
  );
}