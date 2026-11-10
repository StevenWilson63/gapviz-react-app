// src/components/SoundBoothQueueSync.jsx

import React, { useState, useEffect } from "react";
import { MusicApiService } from "../../services/musicApi";
import "../SoundBooth.css"; // Uses your updated SoundBooth layout and momentum rules

export default function SoundBoothQueueSync() {
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlaylistData() {
      setLoading(true);
      const tokens = MusicApiService.getConnectedTokens();
      
      // Prioritize connected platforms (Spotify first, then Tidal)
      let platform = null;
      if (tokens.spotify) platform = "spotify";
      else if (tokens.tidal) platform = "tidal";

      if (platform) {
        const data = await MusicApiService.fetchUserPlaylists(platform);
        setActivePlaylist(data);
      } else {
        // Fallback default if no external service is connected
        setActivePlaylist({
          name: "Default SoundBooth Stream",
          platform: "Local",
          tracks: [
            { id: 1, title: "Standard Track 1", artist: "DJ Host", status: "played" },
            { id: 2, title: "Standard Track 2", artist: "DJ Host", status: "current" },
            { id: 3, title: "Standard Track 3", artist: "DJ Host", status: "upcoming" }
          ]
        });
      }
      setLoading(false);
    }

    loadPlaylistData();
  }, []);

  return (
    <div className="soundbooth-overlay">
      {/* Header */}
      <div className="soundbooth-header">
        <div className="soundbooth-header-title">SOUNDBOOTH PLAYER</div>
        <button className="soundbooth-icon-btn red-border">✕</button>
      </div>

      {/* Interactive Top Playlist Bar */}
      <div 
        className="soundbooth-playlist-bar"
        onClick={() => setIsQueueOpen(true)}
      >
        <div className="playlist-bar-left">
          <span className="playlist-icon">🎵</span>
          <div className="playlist-info-text">
            <span className="playlist-label">
              {loading ? "LOADING..." : `CONNECTED VIA ${activePlaylist?.platform.toUpperCase()}`}
            </span>
            <span className="playlist-name">
              {loading ? "Fetching tracks..." : activePlaylist?.name}
            </span>
          </div>
        </div>
        <div className="playlist-bar-right">
          <button className="queue-toggle-btn">
            View Queue ({activePlaylist?.tracks?.length || 0}) ☰
          </button>
        </div>
      </div>

      {/* Album Content & Main View */}
      <div className="soundbooth-content">
        <img 
          src="https://via.placeholder.com/200" 
          alt="Album Cover" 
          className="soundbooth-art"
        />
        <h2 className="soundbooth-song-title">
          {activePlaylist?.tracks?.find(t => t.status === "current")?.title || "No Track Playing"}
        </h2>
        <p className="soundbooth-artist">
          {activePlaylist?.tracks?.find(t => t.status === "current")?.artist || "Unknown Artist"}
        </p>
        <p className="soundbooth-album">{activePlaylist?.name}</p>
      </div>

      {/* Progress Bar */}
      <div className="soundbooth-progress-container">
        <div className="soundbooth-progress-bar">
          <div className="soundbooth-progress-fill" style={{ width: "45%" }}></div>
        </div>
        <div className="soundbooth-time-row">
          <span>1:42</span>
          <span>3:45</span>
        </div>
      </div>

      {/* Control Room Action Button */}
      <button className="soundbooth-control-room-btn">
        <span>⚙️</span> OPEN DJ CONTROL ROOM
      </button>

      {/* Slide-Up Queue Drawer Modal */}
      {isQueueOpen && (
        <div className="soundbooth-queue-overlay" onClick={() => setIsQueueOpen(false)}>
          <div className="soundbooth-queue-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="queue-drawer-header">
              <div className="queue-drawer-title-group">
                <h3>Up Next & Active Queue</h3>
                <span className="queue-subtitle">Synced with {activePlaylist?.platform}</span>
              </div>
              <button className="queue-close-btn" onClick={() => setIsQueueOpen(false)}>✕</button>
            </div>

            <div className="queue-tracks-list">
              {activePlaylist?.tracks?.map((track, idx) => (
                <div key={track.id} className={`queue-track-item track-${track.status}`}>
                  <span className="track-number">{idx + 1}</span>
                  <div className="queue-track-meta">
                    <span className="queue-track-title">{track.title}</span>
                    <span className="queue-track-artist">{track.artist}</span>
                  </div>
                  <span className="queue-track-status-badge">{track.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}