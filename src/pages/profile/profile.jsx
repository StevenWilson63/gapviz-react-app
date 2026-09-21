import React from "react";
import "./profile.css";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div className="profile-screen">

      {/* Back to Home */}
      <button className="back-home-btn" onClick={() => navigate("/")}>
        ← Home
      </button>

      <h1 className="profile-title">Profile</h1>

      <div className="profile-list">

        {/* Account */}
        <div
          className="profile-row hover-box"
          onClick={() => navigate("/profile/account")}
        >
          Account
        </div>

        {/* Subscription */}
        <div
          className="profile-row hover-box"
          onClick={() => navigate("/profile/subscription")}
        >
          Subscription
        </div>

        {/* Your DJs */}
        <div
          className="profile-row hover-box"
          onClick={() => navigate("/profile/dj")}
        >
          Your DJs
        </div>

        {/* Connected Services */}
        <div
          className="profile-row hover-box"
          onClick={() => navigate("/profile/connected-services")}
        >
          Connected Services
        </div>

        {/* Notifications */}
        <div
          className="profile-row hover-box"
          onClick={() => navigate("/profile/notifications")}
        >
          Notifications
        </div>

        {/* Appearance */}
        <div
          className="profile-row hover-box"
          onClick={() => navigate("/profile/appearance")}
        >
          Appearance
        </div>

        {/* Privacy & Data */}
        <div
          className="profile-row hover-box"
          onClick={() => navigate("/profile/privacy-data")}
        >
          Privacy & Data
        </div>

        {/* Help & Support */}
        <div
          className="profile-row hover-box"
          onClick={() => navigate("/profile/help-support")}
        >
          Help & Support
        </div>

        {/* About */}
        <div
          className="profile-row hover-box"
          onClick={() => navigate("/profile/about")}
        >
          About
        </div>

        {/* Logout — destructive, no glow */}
        <div
          className="logout-row"
          onClick={() => navigate("/profile/logout")}
        >
          Logout
        </div>

      </div>
    </div>
  );
}
