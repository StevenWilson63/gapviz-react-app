import React, { useState } from "react";
import "./Library.css";

export default function Library() {
  const [activeTab, setActiveTab] = useState("playlists");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for each tab
  const libraryData = {
    playlists: [
      { id: 1, name: "Massive Guitar Solos", count: 24, platforms: ["🟢", "🟦", "🍎"], curator: "Gapviz Curated" },
      { id: 2, name: "70s Vinyl Goldmine", count: 42, platforms: ["🟢", "🍎"], curator: "DJ Rude Boy" },
      { id: 3, name: "Late Night Studio Outtakes", count: 18, platforms: ["🟦", "𝑄"], curator: "Archivist AI" },
      { id: 4, name: "Sausalito Sessions", count: 31, platforms: ["🟢", "🟦", "🍎", "☁️"], curator: "Gapviz Curated" }
    ],
    albums: [
      { id: 1, title: "Rumours", artist: "Fleetwood Mac", year: 1977, platform: "🟢", tracks: 11, albumMode: true },
      { id: 2, title: "The Dark Side of the Moon", artist: "Pink Floyd", year: 1973, platform: "🟦", tracks: 10, albumMode: true },
      { id: 3, title: "Dire Straits", artist: "Dire Straits", year: 1978, platform: "🍎", tracks: 9, albumMode: false },
      { id: 4, title: "Hotel California", artist: "Eagles", year: 1976, platform: "🟢", tracks: 9, albumMode: true }
    ],
    songs: [
      { id: 1, title: "Dreams", artist: "Fleetwood Mac", album: "Rumours", platform: "🟢", duration: "4:17" },
      { id: 2, title: "Sultans of Swing", artist: "Dire Straits", album: "Dire Straits", platform: "🟦", duration: "5:48" },
      { id: 3, title: "Comfortably Numb", artist: "Pink Floyd", album: "The Wall", platform: "🍎", duration: "6:23" },
      { id: 4, title: "Go Your Own Way", artist: "Fleetwood Mac", album: "Rumours", platform: "🟢", duration: "3:43" }
    ],
    identified: [
      { id: 1, title: "Dreams", artist: "Fleetwood Mac", date: "Today, 2:15 PM", platform: "🟢", storySnippet: "Written by Stevie Nicks in just 10 minutes..." },
      { id: 2, title: "Sultans of Swing", artist: "Dire Straits", date: "Yesterday", platform: "🟦", storySnippet: "Inspired by a lackluster jazz band in a south London pub..." },
      { id: 3, title: "Hotel California", artist: "Eagles", date: "Oct 28", platform: "🍎", storySnippet: "A metaphor for the dark underbelly of the American dream..." }
    ]
  };

  return (
    <div className="library-screen">
      {/* Header Deck */}
      <div className="library-header">
        <h1>Master Library</h1>
        <p className="library-subtitle">Your aggregated multi-platform music vault & identified lore</p>
      </div>

      {/* Search Bar */}
      <div className="library-search-container">
        <i className="fa-solid fa-magnifying-glass search-icon"></i>
        <input
          type="text"
          placeholder="Search library by title, artist, or tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="library-search-input"
        />
      </div>

      {/* Tab Navigation */}
      <div className="library-tabs">
        <button
          className={`library-tab-btn ${activeTab === "playlists" ? "active" : ""}`}
          onClick={() => setActiveTab("playlists")}
        >
          <i className="fa-solid fa-list"></i> Playlists
        </button>
        <button
          className={`library-tab-btn ${activeTab === "albums" ? "active" : ""}`}
          onClick={() => setActiveTab("albums")}
        >
          <i className="fa-solid fa-compact-disc"></i> Albums
        </button>
        <button
          className={`library-tab-btn ${activeTab === "songs" ? "active" : ""}`}
          onClick={() => setActiveTab("songs")}
        >
          <i className="fa-solid fa-music"></i> Songs
        </button>
        <button
          className={`library-tab-btn ${activeTab === "identified" ? "active" : ""}`}
          onClick={() => setActiveTab("identified")}
        >
          <i className="fa-solid fa-ear-listen"></i> Identified
        </button>
      </div>

      {/* Content Area */}
      <div className="library-content-container">
        {/* PLAYLISTS TAB */}
        {activeTab === "playlists" && (
          <div className="library-grid">
            {libraryData.playlists.map((item) => (
              <div key={item.id} className="library-card">
                <div className="card-top-row">
                  <span className="card-badge-label">PLAYLIST</span>
                  <div className="platform-badges">{item.platforms.join(" ")}</div>
                </div>
                <h3>{item.name}</h3>
                <p className="card-subtext">{item.curator} • {item.count} Tracks</p>
              </div>
            ))}
          </div>
        )}

        {/* ALBUMS TAB */}
        {activeTab === "albums" && (
          <div className="library-grid">
            {libraryData.albums.map((item) => (
              <div key={item.id} className="library-card">
                <div className="card-top-row">
                  <span className="card-badge-label">ALBUM ({item.year})</span>
                  <span className="platform-badge">{item.platform}</span>
                </div>
                <h3>{item.title}</h3>
                <p className="card-subtext">{item.artist} • {item.tracks} Tracks</p>
                {item.albumMode && (
                  <span className="album-mode-tag">
                    <i className="fa-solid fa-book-open"></i> Album Mode Supported
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SONGS TAB */}
        {activeTab === "songs" && (
          <div className="library-list-stack">
            {libraryData.songs.map((item) => (
              <div key={item.id} className="library-row-item">
                <div className="row-item-left">
                  <span className="row-platform">{item.platform}</span>
                  <div className="row-text-group">
                    <span className="row-song-title">{item.title}</span>
                    <span className="row-song-artist">{item.artist} • {item.album}</span>
                  </div>
                </div>
                <span className="row-duration">{item.duration}</span>
              </div>
            ))}
          </div>
        )}

        {/* IDENTIFIED TAB */}
        {activeTab === "identified" && (
          <div className="library-list-stack">
            {libraryData.identified.map((item) => (
              <div key={item.id} className="library-identified-card">
                <div className="identified-header-row">
                  <div className="identified-title-group">
                    <h4>{item.title}</h4>
                    <span className="identified-artist">{item.artist}</span>
                  </div>
                  <span className="identified-date">{item.date} {item.platform}</span>
                </div>
                <p className="identified-story">"{item.storySnippet}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}