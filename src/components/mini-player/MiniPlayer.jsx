// src/components/MiniPlayer/MiniPlayer.jsx

import React from "react";
import { usePlayer } from "../../context/PlayerContext";
import "./MiniPlayer.css";

const formatTime = (ms) => {
  if (!ms || ms < 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = String(totalSec % 60).padStart(2, "0");
  return `${mins}:${secs}`;
};

export default function MiniPlayer({ onOpenSoundBooth }) {
  const { currentTrack, isPlaying, positionMs, durationMs, togglePlay } = usePlayer();

  const handleTogglePlay = (e) => {
    e.stopPropagation();
    togglePlay();
  };

  const progressPercent =
    durationMs > 0 ? Math.min(100, Math.max(0, (positionMs / durationMs) * 100)) : 0;

  return (
    <div id="mini-player-bar" onClick={onOpenSoundBooth}>
      {/* Track Progress Line */}
      <div className="mini-player-progress-track">
        <div
          className="mini-player-progress-fill"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* Track Info */}
      <div className="mini-player-info">
        <img
          src={currentTrack.artworkUrl}
          alt="Album art"
          className="mini-player-art"
        />
        <div className="mini-player-text">
          <div className="mini-player-title-row">
            {isPlaying && <span className="mini-player-pulse"></span>}
            <span className="mini-player-song">{currentTrack.title}</span>
          </div>
          <div className="mini-player-artist">
            {currentTrack.artist} • <span className="mini-player-album">{currentTrack.album}</span>
            {durationMs > 0 && (
              <span> • {formatTime(positionMs)} / {formatTime(durationMs)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="mini-player-controls" onClick={(e) => e.stopPropagation()}>
        <button className="mini-player-btn" onClick={handleTogglePlay}>
          <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`}></i>
        </button>
      </div>
    </div>
  );
}