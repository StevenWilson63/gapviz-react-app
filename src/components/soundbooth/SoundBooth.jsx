import React, { useState } from "react";
import "./SoundBooth.css";

export default function SoundBooth({ isOpen, onClose, onOpenControlRoom }) {
  const [isPlaying, setIsPlaying] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="soundbooth-overlay">
      {/* Top Header Deck */}
      <header className="soundbooth-header">
        {/* Left Circle: Minimize / Back to browsing */}
        <button className="soundbooth-icon-btn" onClick={onClose} title="Minimize Player">
          <i className="fa-solid fa-chevron-down"></i>
        </button>

        <span className="soundbooth-header-title">SoundBooth Player</span>

        {/* Right Circle: Open DJ Control Room / Settings */}
        <button className="soundbooth-icon-btn red-border" onClick={onOpenControlRoom} title="DJ Control Room">
          <i className="fa-solid fa-sliders"></i>
        </button>
      </header>

      {/* Album Artwork & Metadata */}
      <div className="soundbooth-content">
        <img
          src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400"
          alt="Album Art"
          className="soundbooth-art"
        />
        <h2 className="soundbooth-song-title">Dreams</h2>
        <p className="soundbooth-artist">Fleetwood Mac</p>
        <p className="soundbooth-album">Album: Rumours (1977)</p>
      </div>

      {/* Track Progress Scrubber Bar */}
      <div className="soundbooth-progress-container">
        <div className="soundbooth-progress-bar">
          <div className="soundbooth-progress-fill" style={{ width: "35%" }}></div>
        </div>
        <div className="soundbooth-time-row">
          <span>1:24</span>
          <span>4:17</span>
        </div>
      </div>

      {/* Full Playback Controls */}
      <div className="soundbooth-playback-controls">
        <button className="soundbooth-sub-control-btn">
          <i className="fa-solid fa-shuffle"></i>
        </button>
        <button className="soundbooth-sub-control-btn">
          <i className="fa-solid fa-backward-step"></i>
        </button>
        <button className="soundbooth-main-play-btn" onClick={() => setIsPlaying(!isPlaying)}>
          <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`}></i>
        </button>
        <button className="soundbooth-sub-control-btn">
          <i className="fa-solid fa-forward-step"></i>
        </button>
        <button className="soundbooth-sub-control-btn">
          <i className="fa-solid fa-repeat"></i>
        </button>
      </div>

      {/* Live Commentary Card */}
      <div className="soundbooth-commentary-card">
        <div className="soundbooth-commentary-header">
          <span className="soundbooth-story-label">
            <i className="fa-solid fa-comment-dots"></i> Story Behind The Song
          </span>
          <span className="soundbooth-host-tag">Host: DJ Rude Boy</span>
        </div>
        <p className="soundbooth-story-text">
          "Rumours was recorded under intense emotional turmoil in Sausalito, California. Stevie Nicks wrote 'Dreams' in just 10 minutes sitting on a bed in Sly Stone’s studio room..."
        </p>
      </div>

      {/* Gapviz Red Control Room Box */}
      <button className="soundbooth-control-room-btn" onClick={onOpenControlRoom}>
        <i className="fa-solid fa-sliders"></i>
        <span>🎛️ OPEN DJ CONTROL ROOM</span>
      </button>
    </div>
  );
}