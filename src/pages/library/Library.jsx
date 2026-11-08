import React, { useState } from "react";
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

  // Mock data for each tab including Commentary Vault & Inbox items with both song & lore
  const [libraryData, setLibraryData] = useState({
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
      { id: 1, title: "Dreams", artist: "Fleetwood Mac", date: "Today, 2:15 PM", platform: "🟢", storySnippet: "Written by Stevie Nicks in just 10 minutes..." }
    ],
    inbox: [
      { 
        id: 1, 
        title: "Dreams", 
        artist: "Fleetwood Mac", 
        album: "Rumours", 
        year: 1977,
        genre: "Classic Rock",
        savedDate: "Captured in Cafe • 2 hrs ago", 
        platform: "🟢", 
        djPersonaName: "DJ Rude Boy",
        focus: "Backstage & Band History",
        storySnippet: "Written by Stevie Nicks in just 10 minutes at the Record Plant studio in Sausalito during a break from tense recording sessions." 
      },
      { 
        id: 2, 
        title: "Money for Nothing", 
        artist: "Dire Straits", 
        album: "Dire Straits", 
        year: 1985,
        genre: "Rock",
        savedDate: "Captured in Store • Yesterday", 
        platform: "🟦", 
        djPersonaName: "The Curator",
        focus: "Gear & Studio Lore",
        storySnippet: "Mark Knopfler overheard appliance store workers complaining about MTV royalties and used their exact dialogue as lyrics." 
      }
    ],
    commentaryVault: [
      {
        id: 101,
        title: "Comfortably Numb",
        artist: "Pink Floyd",
        year: 1979,
        decade: "1970s",
        genre: "Progressive Rock",
        djPersonaName: "DJ Rude Boy",
        focus: "Gear & Studio Lore",
        savedDate: "Saved 3 days ago",
        storySnippet: "Recorded during bitter creative friction between Roger Waters and David Gilmour, resulting in one of rock history's greatest improvised guitar solos."
      }
    ]
  });

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

  // Inbox Action Handlers
  const handleMoveSongToPlaylist = (item) => {
    // Moves song to playlists & removes from inbox
    setLibraryData(prev => ({
      ...prev,
      songs: [...prev.songs, { id: Date.now(), title: item.title, artist: item.artist, album: item.album || "Unknown", platform: item.platform, duration: "3:45" }],
      inbox: prev.inbox.filter(i => i.id !== item.id)
    }));
  };

  const handleFileLoreToVault = (item) => {
    // Files commentary to vault & removes from inbox
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
    // Adds song to playlist AND commentary to vault, removes from inbox
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
                    <div className="platform-badges">{item.platforms.join(" ")}</div>
                  </div>
                  <h3>{item.name}</h3>
                  <p className="card-subtext">{item.curator} • {item.count} Tracks</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IDENTIFY INBOX TAB (Decision Later Workflow) */}
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

        {/* COMMENTARY VAULT TAB */}
        {activeTab === "commentary" && (
          <div className="vault-wrapper">
            {/* Rich Filtering Bar */}
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

            {/* Commentary Vault List with Active Filters & Sorters */}
            <div className="library-list-stack">
              {libraryData.commentaryVault
                .filter(item => {
                  if (vaultEra !== "all" && item.decade !== vaultEra) return false;
                  if (vaultHost !== "all" && item.djPersonaName !== vaultHost) return false;
                  if (vaultFocus !== "all" && item.focus !== vaultFocus) return false;
                  if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && !item.artist.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                  return true;
                })
                .sort((a, b) => {
                  if (vaultSort === "year-desc") return b.year - a.year;
                  if (vaultSort === "year-asc") return a.year - b.year;
                  if (vaultSort === "artist") return a.artist.localeCompare(b.artist);
                  return 0; // "recent" default
                })
                .length === 0 ? (
                <div className="empty-vault-state">
                  <p>No commentary items match your current filter criteria.</p>
                </div>
              ) : (
                libraryData.commentaryVault
                  .filter(item => {
                    if (vaultEra !== "all" && item.decade !== vaultEra) return false;
                    if (vaultHost !== "all" && item.djPersonaName !== vaultHost) return false;
                    if (vaultFocus !== "all" && item.focus !== vaultFocus) return false;
                    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && !item.artist.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                    return true;
                  })
                  .sort((a, b) => {
                    if (vaultSort === "year-desc") return b.year - a.year;
                    if (vaultSort === "year-asc") return a.year - b.year;
                    if (vaultSort === "artist") return a.artist.localeCompare(b.artist);
                    return 0;
                  })
                  .map((item) => (
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