// src/components/ConnectedServicesHandler.jsx

import React, { useState, useEffect } from "react";
import { MusicApiService } from "../../services/musicApi";
import "../connected-services.css";

export default function ConnectedServicesHandler({ onBack }) {
  const [connections, setConnections] = useState({
    spotify: false,
    tidal: false,
    appleMusic: false
  });
  const [saveStatus, setSaveStatus] = useState(false);

  useEffect(() => {
    const saved = MusicApiService.getConnectedTokens();
    setConnections(saved);
  }, []);

  const handleToggle = (platformKey) => {
    console.log("Button clicked for platform:", platformKey);

    // If connecting Spotify, trigger the auth / redirect flow
    if (platformKey === "spotify" && !connections.spotify) {
      MusicApiService.initiateAuth("spotify");
      return;
    }

    // Otherwise, toggle normally for other platforms or disconnecting
    const updatedState = !connections[platformKey];
    setConnections((prev) => ({ ...prev, [platformKey]: updatedState }));
    MusicApiService.setPlatformConnection(platformKey, updatedState);
  };

  const handleSave = () => {
    setSaveStatus(true);
    setTimeout(() => {
      setSaveStatus(false);
    }, 2500);
  };

  return (
    <div className="connected-services-screen">
      <button className="back-profile-btn" onClick={onBack}>
        ← Back to Profile
      </button>

      <h1 className="connected-services-title">Connected Services</h1>
      <p className="connected-services-subtitle">
        Link your external music accounts to sync live tracks and playlists into SoundBooth.
      </p>

      <div className="connected-services-card">
        {/* Spotify Row */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">🟢 Spotify</span>
            <span className="service-desc">Sync public playlists & active queue</span>
          </div>
          <button
            className={`service-toggle-btn ${connections.spotify ? "connected" : ""}`}
            onClick={() => handleToggle("spotify")}
          >
            {connections.spotify ? "Connected" : "Connect"}
          </button>
        </div>

        {/* Tidal Row */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">🟦 Tidal HiFi</span>
            <span className="service-desc">Stream lossless master audio tracks</span>
          </div>
          <button
            className={`service-toggle-btn ${connections.tidal ? "connected" : ""}`}
            onClick={() => handleToggle("tidal")}
          >
            {connections.tidal ? "Connected" : "Connect"}
          </button>
        </div>

        {/* Apple Music Row */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">🍎 Apple Music</span>
            <span className="service-desc">Import personal library & rotation</span>
          </div>
          <button
            className={`service-toggle-btn ${connections.appleMusic ? "connected" : ""}`}
            onClick={() => handleToggle("appleMusic")}
          >
            {connections.appleMusic ? "Connected" : "Connect"}
          </button>
        </div>
      </div>

      <button className="connected-services-save" onClick={handleSave}>
        Save Preferences
      </button>

      {saveStatus && (
        <div className="save-confirm-box">
          Preferences saved successfully!
        </div>
      )}
    </div>
  );
}