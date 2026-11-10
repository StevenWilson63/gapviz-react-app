import React, { useState, useEffect } from "react";
import { MusicApiService } from "../../services/musicApi";
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
  const [selectedPlaylist, setSelectedPlaylist] = useState(null); // For viewing playlist tracks

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

  // Fetch live Spotify data on mount
  useEffect(() => {
    async function loadLiveMusic() {
      try {
        console.log(">>> [Library] Fetching live Spotify playlists and tracks...");
        const spotifyData = await MusicApiService.fetchUserPlaylists("spotify");
        
        if (spotifyData) {
          console.log(">>> [Library] Live Spotify data received:", spotifyData);
          setLibraryData(prev => ({
            ...prev,
            playlists: [
              {
                id: "live_spotify_1",
                name: spotifyData.name,
                count: spotifyData.tracks?.length || 0,
                platforms: ["🟢"],
                curator: "Connected Spotify Account",
                tracks: spotifyData.tracks || []
              }
            ],
            songs: spotifyData.tracks ? spotifyData.tracks.map((t, idx) => ({
              id: t.id || idx,
              title: t.title,
              artist: t.artist,
              album: spotifyData.name,
              platform: "🟢",
              duration: "3:30"
            })) : prev.songs
          }));
        }
      } catch (err) {
        console.error(">>> [Library] Failed to load live Spotify data:", err);
      }
    }

    loadLiveMusic();
  }, []);

  const togglePlatformSelection = (icon) => {
    if (selectedPlatforms.includes(icon)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== icon));
    } else {
      setSelectedPlatforms([...selectedPlatforms, icon]);
    }
  };

  const handleSaveNewPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    setIsCreatingPlaylist(false);
    setNewPlaylistName("");
  };

  return (
    <div className="library-screen">
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
          <i className="fa-solid fa-list"></i> Playlists
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
              {libraryData.playlists.length === 0 ? (
                <p style={{ color: "#aaa", padding: "20px" }}>Loading your Spotify playlists...</p>
              ) : (
                libraryData.playlists.map((item) => (
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
                <p style={{ color: "#aaa" }}>No tracks found in this playlist.</p>
              )}
            </div>
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

        {/* Other tabs remain as standard */}
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