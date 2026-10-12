import React, { useState, useEffect } from "react";
import "./connectedServices.css";
import { useNavigate } from "react-router-dom";

export default function ConnectedServices() {
  const navigate = useNavigate();

  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [appleMusicConnected, setAppleMusicConnected] = useState(false);
  const [youtubeMusicConnected, setYoutubeMusicConnected] = useState(false);
  const [lastFmConnected, setLastFmConnected] = useState(false);

  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("gv_connectedServices") || "{}");
    setSpotifyConnected(stored.spotify || false);
    setAppleMusicConnected(stored.appleMusic || false);
    setYoutubeMusicConnected(stored.youtubeMusic || false);
    setLastFmConnected(stored.lastFm || false);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const settings = {
      spotify: spotifyConnected,
      appleMusic: appleMusicConnected,
      youtubeMusic: youtubeMusicConnected,
      lastFm: lastFmConnected,
    };
    localStorage.setItem("gv_connectedServices", JSON.stringify(settings));

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="connected-services-screen">
      <button className="back-profile-btn" onClick={() => navigate("/profile")}>
        ← Back to Profile
      </button>

      <h1 className="connected-services-title">Connected Services</h1>
      <p className="connected-services-subtitle">
        Link your streaming platforms and music accounts to sync history and metadata.
      </p>

      <form className="connected-services-card" onSubmit={handleSave}>
        
        {/* SPOTIFY */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">Spotify</span>
            <span className="service-desc">Sync playback history and library tracks</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${spotifyConnected ? "connected" : ""}`}
            onClick={() => setSpotifyConnected(!spotifyConnected)}
          >
            {spotifyConnected ? "Connected ✓" : "Connect"}
          </button>
        </div>

        {/* APPLE MUSIC */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">Apple Music</span>
            <span className="service-desc">Identify current playing tracks via Apple Music API</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${appleMusicConnected ? "connected" : ""}`}
            onClick={() => setAppleMusicConnected(!appleMusicConnected)}
          >
            {appleMusicConnected ? "Connected ✓" : "Connect"}
          </button>
        </div>

        {/* YOUTUBE MUSIC */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">YouTube Music</span>
            <span className="service-desc">Link video & audio stream metadata</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${youtubeMusicConnected ? "connected" : ""}`}
            onClick={() => setYoutubeMusicConnected(!youtubeMusicConnected)}
          >
            {youtubeMusicConnected ? "Connected ✓" : "Connect"}
          </button>
        </div>

        {/* LAST.FM */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">Last.fm</span>
            <span className="service-desc">Scrobble played tracks and retrieve listening stats</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${lastFmConnected ? "connected" : ""}`}
            onClick={() => setLastFmConnected(!lastFmConnected)}
          >
            {lastFmConnected ? "Connected ✓" : "Connect"}
          </button>
        </div>

        {/* METADATA DATABASES (READ-ONLY / ALWAYS ACTIVE) */}
        <div className="service-row hover-box read-only-service">
          <div className="service-info">
            <span className="service-name">MusicBrainz & AcoustID</span>
            <span className="service-desc">Open music database used for DJ trivia & facts</span>
          </div>
          <span className="active-badge">Always Active</span>
        </div>

        {/* SAVE BUTTON */}
        <button className="connected-services-save hover-box" type="submit">
          Save Changes
        </button>

        {savedMessage && (
          <div className="save-confirm-box">✓ Changes Saved</div>
        )}

      </form>
    </div>
  );
}