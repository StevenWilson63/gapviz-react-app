import React, { useState } from "react";
import "./MiniPlayer.css";

export default function MiniPlayer({ onOpenSoundBooth }) {
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = (e) => {
    e.stopPropagation(); // Prevents opening the SoundBooth when clicking play/pause
    setIsPlaying(!isPlaying);
  };

  return (
    <div id="mini-player-bar" onClick={onOpenSoundBooth}>
      {/* Track Progress Line */}
      <div className="mini-player-progress-track">
        <div className="mini-player-progress-fill" style={{ width: "35%" }}></div>
      </div>

      {/* Track Info */}
      <div className="mini-player-info">
        <img
          src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400"
          alt="Album art"
          className="mini-player-art"
        />
        <div className="mini-player-text">
          <div className="mini-player-title-row">
            <span className="mini-player-pulse"></span>
            <span className="mini-player-song">Dreams</span>
          </div>
          <div className="mini-player-artist">
            Fleetwood Mac • <span className="mini-player-album">Rumours (1977)</span>
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="mini-player-controls" onClick={(e) => e.stopPropagation()}>
        <button className="mini-player-btn" onClick={togglePlay}>
          <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`}></i>
        </button>
      </div>
    </div>
  );
}