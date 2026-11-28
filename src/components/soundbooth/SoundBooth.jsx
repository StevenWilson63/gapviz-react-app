// SoundBooth.jsx

import React, { useState, useEffect, useRef } from "react";
import { usePlayer } from "../../context/PlayerContext";
import "./SoundBooth.css";

const formatTime = (ms) => {
  if (!ms || ms < 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = String(totalSec % 60).padStart(2, "0");
  return `${mins}:${secs}`;
};

// HTML5 Canvas Text Renderer Component for Script Anti-Copy Security
function CanvasTeleprompter({ text, fontSize, lineHeightRatio = 1.5 }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    const containerWidth = container.clientWidth || 300;
    const dpr = window.devicePixelRatio || 1;

    const words = text.split(" ");
    let lines = [];
    let currentLine = "";

    ctx.font = `${fontSize}px Arial, sans-serif`;

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > containerWidth - 10 && i > 0) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const calculatedLineHeight = fontSize * lineHeightRatio;
    const canvasHeight = Math.max(lines.length * calculatedLineHeight + 10, 60);

    canvas.width = containerWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, containerWidth, canvasHeight);

    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = "#d4d4d4";
    ctx.textBaseline = "top";

    lines.forEach((line, index) => {
      ctx.fillText(line, 0, index * calculatedLineHeight);
    });
  }, [text, fontSize, lineHeightRatio]);

  return (
    <div ref={containerRef} className="canvas-teleprompter-container">
      <canvas ref={canvasRef} className="soundbooth-canvas-text" />
    </div>
  );
}

const getCommentaryText = (track) => {
  if (!track) return "";
  if (track.narrative) return track.narrative;
  if (track.commentary) return track.commentary;

  const titleLower = (track.title || "").toLowerCase();
  const artistLower = (track.artist || "").toLowerCase();

  if (titleLower === "dreams" && artistLower.includes("fleetwood mac")) {
    return "\"Rumours was recorded under intense emotional turmoil in Sausalito, California. Stevie Nicks wrote 'Dreams' in just 10 minutes sitting on a bed in Sly Stone’s studio room...\"";
  }

  const albumNote =
    track.album && track.album !== "Master Vault"
      ? ` from ${track.album}`
      : "";

  return `"Spinning '${track.title}' by ${track.artist}${albumNote}. Cueing up liner notes, credits, and DJ story context for this track in SoundBooth."`;
};

export default function SoundBooth({ isOpen, onClose, onOpenControlRoom }) {
  const {
    currentTrack,
    isPlaying,
    positionMs,
    durationMs,
    togglePlay,
    playNext,
    playPrevious,
    selectQueueIndex,
    queueMeta
  } = usePlayer();

  const [commentaryFontSize, setCommentaryFontSize] = useState(15);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const currentScriptText = getCommentaryText(currentTrack);

  if (!isOpen) return null;

  const increaseText = () => {
    setCommentaryFontSize((prev) => Math.min(prev + 2, 22));
  };

  const decreaseText = () => {
    setCommentaryFontSize((prev) => Math.max(prev - 2, 13));
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const effectiveDuration = durationMs > 0 ? durationMs : 257000;
  const progressPercent = Math.min(100, Math.max(0, (positionMs / effectiveDuration) * 100));

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

      {/* Interactive Top Playlist Bar */}
      <div className="soundbooth-playlist-bar" onClick={() => setIsQueueOpen(true)}>
        <div className="playlist-bar-left">
          <span className="playlist-icon">🎵</span>
          <div className="playlist-info-text">
            <span className="playlist-label">PLAYLIST</span>
            <span className="playlist-name">{queueMeta.name}</span>
          </div>
        </div>
        <div className="playlist-bar-right">
          <div className="platform-badges">
            {queueMeta.platforms.map((p, idx) => (
              <span key={idx} title={p.name}>{p.icon}</span>
            ))}
          </div>
          <button className="queue-toggle-btn">
            Track List <i className="fa-solid fa-chevron-down"></i>
          </button>
        </div>
      </div>

      {/* Album Artwork & Metadata */}
      <div className="soundbooth-content">
        <img
          src={currentTrack.artworkUrl}
          alt="Album Art"
          className="soundbooth-art"
        />
        <h2 className="soundbooth-song-title">{currentTrack.title}</h2>
        <p className="soundbooth-artist">{currentTrack.artist}</p>
        <p className="soundbooth-album">Album: {currentTrack.album}</p>
      </div>

      {/* Track Progress Scrubber Bar */}
      <div className="soundbooth-progress-container">
        <div className="soundbooth-progress-bar">
          <div className="soundbooth-progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div className="soundbooth-time-row">
          <span>{formatTime(positionMs)}</span>
          <span>{durationMs > 0 ? formatTime(durationMs) : currentTrack.duration || "4:17"}</span>
        </div>
      </div>

      {/* Full Playback Controls */}
      <div className="soundbooth-playback-controls">
        <button className="soundbooth-sub-control-btn" title="Shuffle">
          <i className="fa-solid fa-shuffle"></i>
        </button>
        <button className="soundbooth-sub-control-btn" onClick={playPrevious} title="Previous Track">
          <i className="fa-solid fa-backward-step"></i>
        </button>
        <button className="soundbooth-main-play-btn" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
          <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`}></i>
        </button>
        <button className="soundbooth-sub-control-btn" onClick={playNext} title="Next Track">
          <i className="fa-solid fa-forward-step"></i>
        </button>
        <button className="soundbooth-sub-control-btn" title="Repeat">
          <i className="fa-solid fa-repeat"></i>
        </button>
      </div>

      {/* Live Commentary Card with HTML5 Canvas Teleprompter & Right-Click Suppression */}
      <div
        className="soundbooth-commentary-card user-select-none"
        onContextMenu={handleContextMenu}
      >
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

        {/* HTML5 Canvas Teleprompter (No DOM Text Nodes) */}
        <CanvasTeleprompter text={currentScriptText} fontSize={commentaryFontSize} />

        {/* Attribution Pill Box (Clean Source Name) */}
        <div className="commentary-attribution-wrapper">
          <span className="commentary-attribution-pill">
            MusicBrainz
          </span>
        </div>
      </div>

      {/* Gapviz Red Control Room Button */}
      <button className="soundbooth-control-room-btn" onClick={onOpenControlRoom}>
        <i className="fa-solid fa-sliders"></i>
        <span>🎛️ OPEN DJ CONTROL ROOM</span>
      </button>

      {/* Slide-Up Playlist Queue Drawer */}
      {isQueueOpen && (
        <div className="soundbooth-queue-overlay">
          <div className="soundbooth-queue-drawer">
            <div className="queue-drawer-header">
              <div className="queue-drawer-title-group">
                <h3>{queueMeta.name}</h3>
                <span className="queue-subtitle">
                  {queueMeta.platforms.map((p) => p.icon).join(" ")} Connected Playlist • {queueMeta.tracks.length} Tracks
                </span>
              </div>
              <button className="queue-close-btn" onClick={() => setIsQueueOpen(false)} title="Close Queue">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="queue-tracks-list">
              {queueMeta.tracks.map((track, idx) => {
                let statusClass = "";
                if (track.status === "played") statusClass = "track-played";
                if (track.status === "current") statusClass = "track-current";
                if (track.status === "upcoming") statusClass = "track-upcoming";

                return (
                  <div
                    key={track.id}
                    className={`queue-track-item ${statusClass}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      selectQueueIndex(idx);
                      setIsQueueOpen(false);
                    }}
                  >
                    <span className="track-number">
                      {track.status === "current" ? "▶" : String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="queue-track-meta">
                      <span className="queue-track-title">{track.title}</span>
                      <span className="queue-track-artist">{track.artist}</span>
                    </div>
                    <span className="queue-track-status-badge">
                      {track.status === "played" && "Played"}
                      {track.status === "current" && "Now Playing"}
                      {track.status === "upcoming" && "Up Next"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}