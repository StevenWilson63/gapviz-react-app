import React from "react";
import "./profile.css";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div className="profile-screen">
      <h1 className="profile-title">Profile</h1>

      <div className="profile-list">

        <div
          className="profile-row"
          onClick={() => navigate("/profile/account")}
        >
          Account
        </div>

        <div
          className="profile-row"
          onClick={() => navigate("/profile/subscription")}
        >
          Subscription
        </div>

        <div
          className="profile-row"
          onClick={() => navigate("/profile/dj")}
        >
          DJ Settings
        </div>

        <div
          className="profile-row"
          onClick={() => navigate("/profile/app")}
        >
          App Settings
        </div>

      </div>
    </div>
  );
}
