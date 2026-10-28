import React, { useState } from "react";
import "./SoundBooth.css";

export default function SoundBooth({ isOpen, onClose, onOpenControlRoom }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [commentaryFontSize, setCommentaryFontSize] = useState(15); // Default font size in pixels

  if (!isOpen) return null;

  const increaseText = () => {
    setCommentaryFontSize((prev) => Math.min(prev + 2, 22)); // Max 22px
  };

  const decreaseText = () => {
    setCommentaryFontSize((prev) => Math.max(prev - 2, 13)); // Min 13px
  };

  return (
    <div className="soundbooth-overlay">
      {/* Top Header Deck */}
      <header className="soundbooth-header">
        <button className="soundbooth-icon-btn" onClick={onClose} title="Minimize Player">
          <i className="fa-solid fa-chevron-down"></i>
        </button>

        <span className="soundbooth-header-title">SoundBooth Player</span>

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

      {/* Live Commentary Card with Font Resizer */}
      <div className="soundbooth-commentary-card">
        <div className="soundbooth-commentary-header">
          <span className="soundbooth-story-label">
            <i className="fa-solid fa-comment-dots"></i> Story Behind The Song
          </span>
          <div className="commentary-controls-right">
            <span className="soundbooth-host-tag">DJ Rude Boy</span>
            <div className="font-size-buttons">
              <button onClick={decreaseText} title="Decrease text size" className="font-size-btn">A-</button>
              <button onClick={increaseText} title="Increase text size" className="font-size-btn">A+</button>
            </div>
          </div>
        </div>
        <p className="soundbooth-story-text" style={{ fontSize: `${commentaryFontSize}px`, lineHeight: '1.5' }}>
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