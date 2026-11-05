import React, { useState } from "react";
import "./SoundBooth.css";

export default function SoundBooth({ isOpen, onClose, onOpenControlRoom }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [commentaryFontSize, setCommentaryFontSize] = useState(15);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Mock playlist & queue data
  const activePlaylist = {
    name: "Massive Guitar Solos",
    platforms: [
      { name: "Spotify", icon: "🟢" },
      { name: "Tidal", icon: "🟦" },
      { name: "Apple Music", icon: "🍎" }
    ],
    tracks: [
      { id: 1, title: "Go Your Own Way", artist: "Fleetwood Mac", status: "played" },
      { id: 2, title: "The Chain", artist: "Fleetwood Mac", status: "played" },
      { id: 3, title: "Dreams", artist: "Fleetwood Mac", status: "current" },
      { id: 4, title: "Hotel California", artist: "Eagles", status: "upcoming" },
      { id: 5, title: "Sultans of Swing", artist: "Dire Straits", status: "upcoming" },
      { id: 6, title: "Comfortably Numb", artist: "Pink Floyd", status: "upcoming" }
    ]
  };

  if (!isOpen) return null;

  const increaseText = () => {
    setCommentaryFontSize((prev) => Math.min(prev + 2, 22));
  };

  const decreaseText = () => {
    setCommentaryFontSize((prev) => Math.max(prev - 2, 13));
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

      {/* Interactive Top Playlist Bar */}
      <div className="soundbooth-playlist-bar" onClick={() => setIsQueueOpen(true)}>
        <div className="playlist-bar-left">
          <span className="playlist-icon">🎵</span>
          <div className="playlist-info-text">
            <span className="playlist-label">PLAYLIST</span>
            <span className="playlist-name">{activePlaylist.name}</span>
          </div>
        </div>
        <div className="playlist-bar-right">
          <div className="platform-badges">
            {activePlaylist.platforms.map((p, idx) => (
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
        <button className="soundbooth-sub-control-btn" title="Shuffle">
          <i className="fa-solid fa-shuffle"></i>
        </button>
        <button className="soundbooth-sub-control-btn" title="Previous Track">
          <i className="fa-solid fa-backward-step"></i>
        </button>
        <button className="soundbooth-main-play-btn" onClick={() => setIsPlaying(!isPlaying)} title={isPlaying ? "Pause" : "Play"}>
          <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`}></i>
        </button>
        <button className="soundbooth-sub-control-btn" title="Next Track">
          <i className="fa-solid fa-forward-step"></i>
        </button>
        <button className="soundbooth-sub-control-btn" title="Repeat">
          <i className="fa-solid fa-repeat"></i>
        </button>
      </div> 

      {/* Live Commentary Card with Anti-Copy & Source Attribution Pill */}
      <div className="soundbooth-commentary-card user-select-none">
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
        
        {/* Attribution Pill Box */}
        <div className="commentary-attribution-wrapper">
          <span className="commentary-attribution-pill">
            Metadata via Spotify / MusicBrainz
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
                <h3>{activePlaylist.name}</h3>
                <span className="queue-subtitle">
                  {activePlaylist.platforms.map(p => p.icon).join(" ")} Connected Playlist • {activePlaylist.tracks.length} Tracks
                </span>
              </div>
              <button className="queue-close-btn" onClick={() => setIsQueueOpen(false)} title="Close Queue">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="queue-tracks-list">
              {activePlaylist.tracks.map((track, idx) => {
                let statusClass = "";
                if (track.status === "played") statusClass = "track-played";
                if (track.status === "current") statusClass = "track-current";
                if (track.status === "upcoming") statusClass = "track-upcoming";

                return (
                  <div key={track.id} className={`queue-track-item ${statusClass}`}>
                    <span className="track-number">
                      {track.status === "current" ? "▶" : `0${idx + 1}`}
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