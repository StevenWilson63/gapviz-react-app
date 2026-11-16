// src/pages/library/Library.jsx

import React, { useState, useEffect } from "react";
import { MusicApiService } from "../../services/musicApi";
import { vaultDb, getAllVaultTracks } from "../../services/vaultDb";
import "./Library.css";

export default function Library() {
  const [activeTab, setActiveTab] = useState("playlists");
  const [searchQuery, setSearchQuery] = useState("");

  // Commentary Vault Filter States
  const [vaultSort, setVaultSort] = useState("recent");
  const [vaultEra, setVaultEra] = useState("all");
  const [vaultHost, setVaultHost] = useState("all");
  const [vaultFocus, setVaultFocus] = useState("all");

  // New Playlist Modal/Inline Form State
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["🟢"]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  // Sync Progress Status States
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState("Loading local vault metadata...");
  const [syncProgress, setSyncProgress] = useState({ processed: 0, total: 0, percent: 100, currentTrack: '' });

  // Master Library Data State
  const [libraryData, setLibraryData] = useState({
    playlists: [],
    albums: [
      { id: 1, title: "Rumours", artist: "Fleetwood Mac", year: 1977, platform: "🟢", tracks: 11, albumMode: true }
    ],
    songs: [],
    identified: [],
    inbox: [],
    commentaryVault: []
  });

  // Load from persistent IndexedDB vault on mount. Only fetch from API if local vault is empty.
  useEffect(() => {
    async function initializeLibrary() {
      try {
        console.log(">>> [Library] Checking local IndexedDB vault...");
        
        // 1. Always load local vault tracks first for instant rendering without flashing loaders
        const localTracks = await getAllVaultTracks();
        
        if (localTracks && localTracks.length > 0) {
          console.log(`>>> [Library] Loaded ${localTracks.length} tracks from local vault cache.`);
          setLibraryData(prev => ({
            ...prev,
            songs: localTracks.map((t, idx) => ({
              id: t.id || t.trackKey || idx,
              title: t.title,
              artist: t.artist,
              album: t.album || "Master Vault",
              platform: t.platform === "spotify" ? "🟢" : (t.platform || "🟢"),
              duration: "3:30"
            }))
          }));
        }

        // 2. Check if we already have playlists cached in local storage or state
        const cachedPlaylists = localStorage.getItem("gapviz_cached_playlists");
        if (cachedPlaylists && (!localTracks || localTracks.length === 0)) {
          setLibraryData(prev => ({ ...prev, playlists: JSON.parse(cachedPlaylists) }));
          return;
        }

        // 3. If local vault is empty, perform the initial API fetch with progress modal
        if (!localTracks || localTracks.length === 0) {
          setIsSyncing(true);
          setSyncStatusText("Connecting to Spotify & syncing metadata...");
        }

        const spotifyPlaylists = await MusicApiService.fetchUserPlaylists("spotify");
        if (spotifyPlaylists && spotifyPlaylists.length > 0) {
          setLibraryData(prev => ({
            ...prev,
            playlists: spotifyPlaylists
          }));
          localStorage.setItem("gapviz_cached_playlists", JSON.stringify(spotifyPlaylists));
        }

        if (isSyncing) {
          setSyncStatusText("Transfer Complete");
          setTimeout(() => setIsSyncing(false), 1200);
        }

      } catch (err) {
        console.error(">>> [Library] Failed to initialize library data:", err);
        setIsSyncing(false);
      }
    }

    initializeLibrary();
  }, []);

  const handleSaveNewPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    setIsCreatingPlaylist(false);
    setNewPlaylistName("");
  };

  // Filter songs and playlists based on search query
  const filteredSongs = libraryData.songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlaylists = libraryData.playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.curator?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="library-screen" style={{ position: "relative" }}>
      
      {/* Centered, Pulsing "On Air" Sync Status Modal */}
      {isSyncing && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "#18181b",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "16px",
            padding: "32px",
            width: "420px",
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
            color: "#fff",
            fontFamily: "inherit"
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <span style={{
                background: syncStatusText === "Transfer Complete" ? "#1db954" : "#ff3344",
                color: "white",
                fontSize: "12px",
                fontWeight: "800",
                letterSpacing: "1px",
                padding: "6px 14px",
                borderRadius: "6px",
                boxShadow: syncStatusText === "Transfer Complete" ? "0 0 15px rgba(29, 185, 84, 0.6)" : "0 0 20px rgba(255, 51, 68, 0.8)",
                animation: syncStatusText === "Transfer Complete" ? "none" : "pulse-glow 1.5s infinite"
              }}>
                {syncStatusText === "Transfer Complete" ? "READY" : "ON AIR"}
              </span>
            </div>

            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px 0" }}>
              {syncStatusText}
            </h2>
            
            <p style={{ fontSize: "14px", color: "#a1a1aa", margin: "0 0 24px 0" }}>
              Aggregating metadata vault securely in browser storage...
            </p>

            <div style={{ background: "rgba(255, 255, 255, 0.1)", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
              <div style={{ 
                background: "#1db954", 
                height: "100%", 
                width: `${syncStatusText === "Transfer Complete" ? 100 : 75}%`, 
                transition: "width 0.3s ease" 
              }}></div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#71717a" }}>
              <span>{syncStatusText === "Transfer Complete" ? "Vault synchronized" : "Transferring metadata records"}</span>
              <span>{syncStatusText === "Transfer Complete" ? "100%" : "75%"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header Deck */}
      <div className="library-header">
        <h1>Master Library</h1>
        <p className="library-subtitle">Your aggregated multi-platform music vault, identified tracks & saved lore</p>
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
          onClick={() => { setActiveTab("playlists"); setSelectedPlaylist(null); }}
        >
          <i className="fa-solid fa-list"></i> Playlists ({libraryData.playlists.length})
        </button>
        <button
          className={`library-tab-btn ${activeTab === "inbox" ? "active" : ""}`}
          onClick={() => setActiveTab("inbox")}
        >
          <i className="fa-solid fa-inbox"></i> Identify Inbox ({libraryData.inbox.length})
        </button>
        <button
          className={`library-tab-btn ${activeTab === "albums" ? "active" : ""}`}
          onClick={() => setActiveTab("albums")}
        >
          <i className="fa-solid fa-compact-disc"></i> Albums ({libraryData.albums.length})
        </button>
        <button
          className={`library-tab-btn ${activeTab === "songs" ? "active" : ""}`}
          onClick={() => setActiveTab("songs")}
        >
          <i className="fa-solid fa-music"></i> Songs ({libraryData.songs.length})
        </button>
        <button
          className={`library-tab-btn ${activeTab === "identified" ? "active" : ""}`}
          onClick={() => setActiveTab("identified")}
        >
          <i className="fa-solid fa-ear-listen"></i> Identified ({libraryData.identified.length})
        </button>
        <button
          className={`library-tab-btn ${activeTab === "commentary" ? "active" : ""}`}
          onClick={() => setActiveTab("commentary")}
        >
          <i className="fa-solid fa-microphone-lines"></i> Commentary Vault ({libraryData.commentaryVault.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="library-content-container">
        
        {/* PLAYLISTS TAB */}
        {activeTab === "playlists" && !selectedPlaylist && (
          <div className="playlists-wrapper">
            <div className="create-playlist-trigger-bar">
              <button 
                className="create-playlist-btn"
                onClick={() => setIsCreatingPlaylist(!isCreatingPlaylist)}
              >
                <i className="fa-solid fa-plus"></i> Create New Playlist
              </button>
            </div>

            {isCreatingPlaylist && (
              <div className="playlist-creator-card">
                <div className="creator-header">
                  <h3>Build New Playlist</h3>
                  <button className="close-creator-btn" onClick={() => setIsCreatingPlaylist(false)}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <div className="creator-field">
                  <label>Playlist Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Cafe Discoveries & Late Night Rock"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="creator-input"
                  />
                </div>

                <div className="creator-actions">
                  <button className="save-playlist-confirm-btn" onClick={handleSaveNewPlaylist}>
                    <i className="fa-solid fa-check"></i> Save & Build Playlist
                  </button>
                </div>
              </div>
            )}

            <div className="library-grid">
              {filteredPlaylists.length === 0 ? (
                <p style={{ color: "#aaa", padding: "20px" }}>No playlists found. Connect Spotify in your profile to sync your playlists.</p>
              ) : (
                filteredPlaylists.map((item) => (
                  <div 
                    key={item.id} 
                    className="library-card" 
                    onClick={() => setSelectedPlaylist(item)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="card-top-row">
                      <span className="card-badge-label">PLAYLIST</span>
                      <div className="platform-badges">{Array.isArray(item.platforms) ? item.platforms.join(" ") : item.platforms}</div>
                    </div>
                    <h3>{item.name}</h3>
                    <p className="card-subtext">{item.curator} • {item.count} Tracks</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* DETAILED PLAYLIST VIEW WHEN CLICKED */}
        {activeTab === "playlists" && selectedPlaylist && (
          <div className="playlist-detail-view">
            <button className="back-btn" onClick={() => setSelectedPlaylist(null)} style={{ marginBottom: "20px", background: "none", border: "1px solid #444", color: "#fff", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
              <i className="fa-solid fa-arrow-left"></i> Back to Playlists
            </button>
            <h2>{selectedPlaylist.name}</h2>
            <p style={{ color: "#aaa", marginBottom: "20px" }}>{selectedPlaylist.curator} • {selectedPlaylist.tracks?.length || 0} Tracks</p>
            
            <div className="library-list-stack">
              {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 ? (
                selectedPlaylist.tracks.map((track, idx) => (
                  <div key={track.id || idx} className="library-row-item">
                    <div className="row-item-left">
                      <span className="row-platform">🟢</span>
                      <div className="row-text-group">
                        <span className="row-song-title">{track.title}</span>
                        <span className="row-song-artist">{track.artist}</span>
                      </div>
                    </div>
                    <span className="row-duration">{track.status === "current" ? "Playing Now" : "Queued"}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: "#aaa" }}>No tracks found in this playlist (Restricted third-party container).</p>
              )}
            </div>
          </div>
        )}

        {/* SONGS TAB */}
        {activeTab === "songs" && (
          <div className="library-list-stack">
            {filteredSongs.length === 0 ? (
              <p style={{ color: "#aaa", padding: "20px" }}>Your Master Vault songs list is empty. Run a sync to populate your music.</p>
            ) : (
              filteredSongs.map((item) => (
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
              ))
            )}
          </div>
        )}

        {/* Other tabs */}
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
              </div>
            ))}
          </div>
        )}

        {activeTab === "inbox" && (
          <div className="empty-vault-state"><p>Your Identify Inbox is empty.</p></div>
        )}
        {activeTab === "identified" && (
          <div className="empty-vault-state"><p>No recently identified songs yet.</p></div>
        )}
        {activeTab === "commentary" && (
          <div className="empty-vault-state"><p>Your Commentary Vault is empty.</p></div>
        )}

      </div>
    </div>
  );
}