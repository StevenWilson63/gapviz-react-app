import React from "react";
import "./SoundBooth.css";

export default function SoundBooth({ isOpen, onClose, onOpenControlRoom }) {
  if (!isOpen) return null;

  return (
    <div className="soundbooth-overlay">
      {/* Top Header Deck */}
      <header className="soundbooth-header">
        <button className="soundbooth-icon-btn" onClick={onClose}>
          <i className="fa-solid fa-chevron-down"></i>
        </button>
        <span className="soundbooth-header-title">SoundBooth Player</span>
        {/* Entry Point 1: Top-right slider icon */}
        <button className="soundbooth-icon-btn red-border" onClick={onOpenControlRoom}>
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

      {/* Entry Point 2: Gapviz Red Control Room Box */}
      <button className="soundbooth-control-room-btn" onClick={onOpenControlRoom}>
        <i className="fa-solid fa-sliders"></i>
        <span>🎛️ DJ SOUNDSTUDIO CONTROL ROOM</span>
      </button>
    </div>
  );
}