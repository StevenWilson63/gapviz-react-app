import React from "react";
import { usePlayer } from "../../context/PlayerContext";
import "./MiniPlayer.css";

export default function MiniPlayer({ onOpenSoundBooth }) {
  const { currentTrack, isPlaying, togglePlay } = usePlayer();

  const handleTogglePlay = (e) => {
    e.stopPropagation(); // Prevents opening the SoundBooth when clicking play/pause
    togglePlay();
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