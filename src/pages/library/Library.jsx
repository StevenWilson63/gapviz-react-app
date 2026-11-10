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

  // Master Library Data State (Initialized with placeholders, updated live via useEffect)
  const [libraryData, setLibraryData] = useState({
    playlists: [
      { id: 1, name: "Loading real playlists...", count: 0, platforms: ["🟢"], curator: "Spotify Sync" }
    ],
    albums: [
      { id: 1, title: "Rumours", artist: "Fleetwood Mac", year: 1977, platform: "🟢", tracks: 11, albumMode: true }
    ],
    songs: [
      { id: 1, title: "Loading live tracks...", artist: "Syncing...", album: "Spotify", platform: "🟢", duration: "--:--" }
    ],
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
                curator: "Connected Spotify Account"
              },
              ...prev.playlists
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

  const handleMoveSongToPlaylist = (item) => {
    setLibraryData(prev => ({
      ...prev,
      songs: [...prev.songs, { id: Date.now(), title: item.title, artist: item.artist, album: item.album || "Unknown", platform: item.platform, duration: "3:45" }],
      inbox: prev.inbox.filter(i => i.id !== item.id)
    }));
  };

  const handleFileLoreToVault = (item) => {
    setLibraryData(prev => ({
      ...prev,
      commentaryVault: [...prev.commentaryVault, {
        id: Date.now(),
        title: item.title,
        artist: item.artist,
        year: item.year || 1980,
        decade: item.year ? `${Math.floor(item.year / 10) * 10}s` : "1980s",
        genre: item.genre || "Rock",
        djPersonaName: item.djPersonaName || "DJ Rude Boy",
        focus: item.focus || "Backstage & Band History",
        savedDate: "Just now",
        storySnippet: item.storySnippet
      }],
      inbox: prev.inbox.filter(i => i.id !== item.id)
    }));
  };

  const handleKeepBoth = (item) => {
    setLibraryData(prev => ({
      ...prev,
      songs: [...prev.songs, { id: Date.now(), title: item.title, artist: item.artist, album: item.album || "Unknown", platform: item.platform, duration: "3:45" }],
      commentaryVault: [...prev.commentaryVault, {
        id: Date.now() + 1,
        title: item.title,
        artist: item.artist,
        year: item.year || 1980,
        decade: item.year ? `${Math.floor(item.year / 10) * 10}s` : "1980s",
        genre: item.genre || "Rock",
        djPersonaName: item.djPersonaName || "DJ Rude Boy",
        focus: item.focus || "Backstage & Band History",
        savedDate: "Just now",
        storySnippet: item.storySnippet
      }],
      inbox: prev.inbox.filter(i => i.id !== item.id)
    }));
  };

  const handleRemoveInboxItem = (id) => {
    setLibraryData(prev => ({
      ...prev,
      inbox: prev.inbox.filter(item => item.id !== id)
    }));
  };

  const handleRemoveVaultItem = (id) => {
    setLibraryData(prev => ({
      ...prev,
      commentaryVault: prev.commentaryVault.filter(item => item.id !== id)
    }));
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
          onClick={() => setActiveTab("playlists")}
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
        {activeTab === "playlists" && (
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

                <div className="creator-field">
                  <label>Target Streaming Platforms</label>
                  <div className="platform-selector-row">
                    {[
                      { name: "Spotify", icon: "🟢" },
                      { name: "Tidal", icon: "🟦" },
                      { name: "Apple Music", icon: "🍎" },
                      { name: "SoundCloud", icon: "☁️" }
                    ].map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        className={`platform-toggle-chip ${selectedPlatforms.includes(p.icon) ? "selected" : ""}`}
                        onClick={() => togglePlatformSelection(p.icon)}
                      >
                        {p.icon} {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="creator-actions">
                  <button className="save-playlist-confirm-btn" onClick={handleSaveNewPlaylist}>
                    <i className="fa-solid fa-check"></i> Save & Build Playlist
                  </button>
                </div>
              </div>
            )}

            <div className="library-grid">
              {libraryData.playlists.map((item) => (
                <div key={item.id} className="library-card">
                  <div className="card-top-row">
                    <span className="card-badge-label">PLAYLIST</span>
                    <div className="platform-badges">{Array.isArray(item.platforms) ? item.platforms.join(" ") : item.platforms}</div>
                  </div>
                  <h3>{item.name}</h3>
                  <p className="card-subtext">{item.curator} • {item.count} Tracks</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IDENTIFY INBOX TAB */}
        {activeTab === "inbox" && (
          <div className="library-list-stack">
            <div className="saved-tab-banner">
              <i className="fa-solid fa-bolt" style={{ color: "#ef4444" }}></i>
              <span>Captured on the go. Decide later whether to keep the track, the commentary, or both.</span>
            </div>

            {libraryData.inbox.length === 0 ? (
              <div className="empty-vault-state">
                <p>Your Identify Inbox is empty. Scan songs on the Identify screen and tap "Save for Later".</p>
              </div>
            ) : (
              libraryData.inbox.map((item) => (
                <div key={item.id} className="library-identified-card saved-card">
                  <div className="identified-header-row">
                    <div className="identified-title-group">
                      <h4>{item.title} — {item.artist} ({item.year})</h4>
                      <span className="identified-artist">Delivered by: {item.djPersonaName}</span>
                    </div>
                    <span className="identified-date">{item.platform}</span>
                  </div>
                  
                  <div className="inbox-commentary-preview">
                    <p className="identified-story">"{item.storySnippet}"</p>
                  </div>

                  <div className="inbox-card-decisions-row">
                    <button className="inbox-action-chip" onClick={() => handleMoveSongToPlaylist(item)}>
                      📁 Save Song to Playlist
                    </button>
                    <button className="inbox-action-chip" onClick={() => handleFileLoreToVault(item)}>
                      💬 File Lore to Vault
                    </button>
                    <button className="inbox-action-chip primary" onClick={() => handleKeepBoth(item)}>
                      ⭐ Keep Both
                    </button>
                    <button className="inbox-action-chip danger" onClick={() => handleRemoveInboxItem(item.id)} title="Discard">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>

                  <div className="saved-footer-row">
                    <span className="saved-timestamp">{item.savedDate}</span>
                  </div>
                </div>
              ))
            )}
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

        {/* IDENTIFIED HISTORY TAB */}
        {activeTab === "identified" && (
          <div className="library-list-stack">
            {libraryData.identified.length === 0 ? (
              <div className="empty-vault-state">
                <p>No recently identified songs yet.</p>
              </div>
            ) : (
              libraryData.identified.map((item) => (
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
              ))
            )}
          </div>
        )}

        {/* COMMENTARY VAULT TAB */}
        {activeTab === "commentary" && (
          <div className="vault-wrapper">
            <div className="vault-filter-bar">
              <div className="filter-group">
                <label>Sort:</label>
                <select value={vaultSort} onChange={(e) => setVaultSort(e.target.value)} className="vault-select">
                  <option value="recent">Recently Saved</option>
                  <option value="year-desc">Release Year (Newest)</option>
                  <option value="year-asc">Release Year (Oldest)</option>
                  <option value="artist">Artist A–Z</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Era:</label>
                <select value={vaultEra} onChange={(e) => setVaultEra(e.target.value)} className="vault-select">
                  <option value="all">All Decades</option>
                  <option value="1960s">1960s</option>
                  <option value="1970s">1970s</option>
                  <option value="1980s">1980s</option>
                  <option value="1990s">1990s</option>
                  <option value="2000s+">2000s+</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Host:</label>
                <select value={vaultHost} onChange={(e) => setVaultHost(e.target.value)} className="vault-select">
                  <option value="all">All Presenters</option>
                  <option value="DJ Rude Boy">DJ Rude Boy</option>
                  <option value="The Curator">The Curator</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Focus:</label>
                <select value={vaultFocus} onChange={(e) => setVaultFocus(e.target.value)} className="vault-select">
                  <option value="all">All Focus Areas</option>
                  <option value="Backstage & Band History">Backstage Lore</option>
                  <option value="Gear & Studio Lore">Gear & Studio</option>
                </select>
              </div>
            </div>

            <div className="library-list-stack">
              {libraryData.commentaryVault.length === 0 ? (
                <div className="empty-vault-state">
                  <p>Your Commentary Vault is empty. Save stories from the Identify or DJ screens!</p>
                </div>
              ) : (
                libraryData.commentaryVault.map((item) => (
                  <div key={item.id} className="library-identified-card vault-card">
                    <div className="identified-header-row">
                      <div className="identified-title-group">
                        <h4>🎙️ {item.title} — {item.artist} ({item.year})</h4>
                        <span className="identified-artist">Delivered by: {item.djPersonaName} | {item.focus}</span>
                      </div>
                      <span className="identified-date">{item.savedDate}</span>
                    </div>

                    <p className="identified-story">"{item.storySnippet}"</p>

                    <div className="vault-card-actions">
                      <button className="add-to-playlist-btn" onClick={() => alert("Synthesizing audio clip via Kokoro-82M ONNX...")}>
                        <i className="fa-solid fa-play"></i> Play DJ Commentary
                      </button>
                      <button className="remove-saved-btn" onClick={() => handleRemoveVaultItem(item.id)} title="Remove from Vault">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}