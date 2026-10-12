import React, { useState, useEffect } from "react";
import "./connectedServices.css";
import { useNavigate } from "react-router-dom";

export default function ConnectedServices() {
  const navigate = useNavigate();

  // Alphabetical streaming platforms state
  const [amazonMusicConnected, setAmazonMusicConnected] = useState(false);
  const [appleMusicConnected, setAppleMusicConnected] = useState(false);
  const [deezerConnected, setDeezerConnected] = useState(false);
  const [qobuzConnected, setQobuzConnected] = useState(false);
  const [soundcloudConnected, setSoundcloudConnected] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [tidalConnected, setTidalConnected] = useState(false);
  const [youtubeMusicConnected, setYoutubeMusicConnected] = useState(false);

  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("gv_connectedServices") || "{}");
    setAmazonMusicConnected(stored.amazonMusic || false);
    setAppleMusicConnected(stored.appleMusic || false);
    setDeezerConnected(stored.deezer || false);
    setQobuzConnected(stored.qobuz || false);
    setSoundcloudConnected(stored.soundcloud || false);
    setSpotifyConnected(stored.spotify || false);
    setTidalConnected(stored.tidal || false);
    setYoutubeMusicConnected(stored.youtubeMusic || false);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const settings = {
      amazonMusic: amazonMusicConnected,
      appleMusic: appleMusicConnected,
      deezer: deezerConnected,
      qobuz: qobuzConnected,
      soundcloud: soundcloudConnected,
      spotify: spotifyConnected,
      tidal: tidalConnected,
      youtubeMusic: youtubeMusicConnected,
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
        Link your streaming platforms to sync playback state and track metadata.
      </p>

      <form className="connected-services-card" onSubmit={handleSave}>
        
        {/* AMAZON MUSIC */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">Amazon Music</span>
            <span className="service-desc">Sync active stream state and cloud library</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${amazonMusicConnected ? "connected" : ""}`}
            onClick={() => setAmazonMusicConnected(!amazonMusicConnected)}
          >
            {amazonMusicConnected ? "Connected ✓" : "Connect"}
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

        {/* DEEZER */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">Deezer</span>
            <span className="service-desc">Sync playback state and flow playlists</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${deezerConnected ? "connected" : ""}`}
            onClick={() => setDeezerConnected(!deezerConnected)}
          >
            {deezerConnected ? "Connected ✓" : "Connect"}
          </button>
        </div>

        {/* QOBUZ */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">Qobuz</span>
            <span className="service-desc">Sync hi-res audio stream metadata</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${qobuzConnected ? "connected" : ""}`}
            onClick={() => setQobuzConnected(!qobuzConnected)}
          >
            {qobuzConnected ? "Connected ✓" : "Connect"}
          </button>
        </div>

        {/* SOUNDCLOUD */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">SoundCloud</span>
            <span className="service-desc">Link independent tracks, sets, and live audio</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${soundcloudConnected ? "connected" : ""}`}
            onClick={() => setSoundcloudConnected(!soundcloudConnected)}
          >
            {soundcloudConnected ? "Connected ✓" : "Connect"}
          </button>
        </div>

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

        {/* TIDAL */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">Tidal</span>
            <span className="service-desc">Connect lossless streaming playback state</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${tidalConnected ? "connected" : ""}`}
            onClick={() => setTidalConnected(!tidalConnected)}
          >
            {tidalConnected ? "Connected ✓" : "Connect"}
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

        {/* METADATA DATABASES (READ-ONLY / ALWAYS ACTIVE) */}
        <div className="service-row hover-box read-only-service">
          <div className="service-info">
            <span className="service-name">MusicBrainz, Wikidata & Wikipedia</span>
            <span className="service-desc">Open public domain databases used for DJ trivia & facts</span>
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