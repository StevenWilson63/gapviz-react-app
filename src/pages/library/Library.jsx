// src/pages/library/Library.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MusicApiService,
  syncSpotifyLibrary,
  getSyncInfo,
  SpotifyRateLimitError,
  SpotifyAuthError
} from "../../services/musicApi";
import {
  getAllVaultTracks,
  getVaultPlaylists,
  getPlaylistTracks,
  getPlaylistTrackCounts,
  setPlaylistArchived,
  requeuePlaylist,
  vaultDb
} from "../../services/vaultDb";
import "./Library.css";

const formatDuration = (ms) => {
  if (!ms) return "";
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
};

const formatWait = (seconds) => {
  if (seconds < 90) return `${seconds} seconds`;
  const mins = Math.ceil(seconds / 60);
  if (mins < 120) return `${mins} minutes`;
  return `${Math.ceil(mins / 60)} hours`;
};

const spotifyPlaylistUrl = (playlistKey) => `https://open.spotify.com/playlist/${playlistKey.split(":")[1]}`;

const smallButtonStyle = {
  background: "none",
  border: "1px solid #444",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: "6px",
  cursor: "pointer",
  textDecoration: "none",
  fontSize: "14px",
  display: "inline-block"
};

export default function Library() {
  const [activeTab, setActiveTab] = useState("playlists");
  const [searchQuery, setSearchQuery] = useState("");

  // Commentary Vault Filter States
  const [vaultSort, setVaultSort] = useState("recent");
  const [vaultEra, setVaultEra] = useState("all");
  const [vaultHost, setVaultHost] = useState("all");
  const [vaultFocus, setVaultFocus] = useState("all");

  // New Playlist Modal / Inline Form State
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  // Crate Builder / Station Generator State
  const [isCrateBuilderOpen, setIsCrateBuilderOpen] = useState(false);
  const [stationArtist, setStationArtist] = useState("");

  // Rename & Delete Modal State
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirmPlaylist, setDeleteConfirmPlaylist] = useState(null);

  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  // Sync Progress Status States
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState("Connecting to Spotify & syncing metadata...");
  const [syncProgress, setSyncProgress] = useState({ processed: 0, total: 0, percent: 5, currentTrack: "" });
  const [syncNotice, setSyncNotice] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [hiddenPlaylists, setHiddenPlaylists] = useState(0);

  const abortRef = useRef(null);
  const spotifyConnected = MusicApiService.getConnectedTokens().spotify;

  const [libraryData, setLibraryData] = useState({
    playlists: [],
    albums: [],
    songs: [],
    identified: [],
    inbox: [],
    commentaryVault: []
  });

  const loadFromVault = useCallback(async () => {
    const [playlists, tracks, trackCounts] = await Promise.all([
      getVaultPlaylists(),
      getAllVaultTracks(),
      getPlaylistTrackCounts()
    ]);

    const albumMap = new Map();
    tracks.forEach((t) => {
      const primaryArtist = (t.artist || "Unknown Artist").split(", ")[0];
      const key = `${t.album}||${primaryArtist}`;
      const existing = albumMap.get(key);
      if (existing) {
        existing.tracks += 1;
      } else {
        albumMap.set(key, {
          id: key,
          title: t.album || "Single",
          artist: primaryArtist,
          year: t.releaseYear || "—",
          platform: "🟢",
          tracks: 1,
          albumMode: true
        });
      }
    });

    setLibraryData((prev) => ({
      ...prev,
      playlists: playlists.map((pl) => {
        const imported = trackCounts[pl.playlistKey] || 0;
        return {
          id: pl.playlistKey,
          name: pl.name,
          count: imported || pl.trackCount || 0,
          platforms: pl.platform === "custom" ? ["🎛️"] : ["🟢"],
          curator: pl.curator || "You (Gapviz Vault)",
          spotifyOwned: !!pl.spotifyOwned,
          isCustom: pl.platform === "custom" || pl.isCustom,
          isShell: !!pl.restricted && imported === 0,
          isArchived: !!pl.isArchived
        };
      }),
      songs: tracks.map((t, idx) => ({
        id: t.id || t.trackKey || idx,
        title: t.title,
        artist: t.artist,
        album: t.album || "Master Vault",
        platform: "🟢",
        duration: formatDuration(t.durationMs)
      })),
      albums: [...albumMap.values()].sort((a, b) => a.title.localeCompare(b.title))
    }));
  }, []);

  const refreshSyncInfo = useCallback(async () => {
    const info = await getSyncInfo();
    setCooldownSeconds(info.cooldownSeconds);
    setLastSyncAt(info.lastSyncAt);
    setHiddenPlaylists(info.hiddenPlaylists || 0);
  }, []);

  useEffect(() => {
    localStorage.removeItem("gapviz_spotify_playlists_cache");
    loadFromVault().catch((err) => console.error(">>> [Library] Failed to read vault:", err));
    refreshSyncInfo().catch(() => {});
    return () => abortRef.current?.abort();
  }, [loadFromVault, refreshSyncInfo]);

  const handleSync = async () => {
    if (isSyncing) return;
    const controller = new AbortController();
    abortRef.current = controller;

    setSyncNotice("");
    setSyncStatusText("Connecting to Spotify & syncing metadata...");
    setSyncProgress({ processed: 0, total: 0, percent: 5, currentTrack: "" });
    setIsSyncing(true);

    try {
      await syncSpotifyLibrary({
        signal: controller.signal,
        onProgress: (p) => {
          if (p.currentTrack) setSyncProgress((prev) => ({ ...prev, currentTrack: p.currentTrack }));
          if (p.percent) setSyncProgress((prev) => ({ ...prev, percent: p.percent }));
        }
      });

      await loadFromVault();
      await refreshSyncInfo();
      setIsSyncing(false);
    } catch (err) {
      setIsSyncing(false);
      if (err instanceof SpotifyRateLimitError) {
        setSyncNotice(`Spotify rate limit reached. Try again in ${formatWait(err.retryAfterSec)}.`);
      } else if (err instanceof SpotifyAuthError) {
        setSyncNotice("Spotify connection expired. Reconnect in Connected Services.");
      } else {
        setSyncNotice(`Sync stopped: ${err.message}`);
      }
    }
  };

  const handleStopSync = () => abortRef.current?.abort();

  // Create Custom Playlist
  const handleSaveNewPlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    const playlistKey = `custom:${Date.now()}`;
    await vaultDb.playlists.put({
      playlistKey,
      name: newPlaylistName.trim(),
      platform: "custom",
      curator: "You (Gapviz Vault)",
      trackCount: 0,
      isCustom: true,
      sortOrder: Date.now()
    });
    setNewPlaylistName("");
    setIsCreatingPlaylist(false);
    await loadFromVault();
  };

  // Rename Playlist
  const handleRenamePlaylist = async () => {
    if (!editingPlaylist || !renameValue.trim()) return;
    const record = await vaultDb.playlists.where("playlistKey").equals(editingPlaylist.id).first();
    if (record) {
      await vaultDb.playlists.update(record.id, { name: renameValue.trim() });
    }
    setEditingPlaylist(null);
    setRenameValue("");
    if (selectedPlaylist && selectedPlaylist.id === editingPlaylist.id) {
      setSelectedPlaylist((prev) => ({ ...prev, name: renameValue.trim() }));
    }
    await loadFromVault();
  };

  // Gapviz-Only Playlist Deletion
  const handleDeleteGapvizPlaylist = async () => {
    if (!deleteConfirmPlaylist) return;
    const playlistKey = deleteConfirmPlaylist.id;
    const record = await vaultDb.playlists.where("playlistKey").equals(playlistKey).first();
    if (record) {
      await vaultDb.playlists.delete(record.id);
    }
    await vaultDb.playlistTracks.where("playlistKey").equals(playlistKey).delete();
    setDeleteConfirmPlaylist(null);
    if (selectedPlaylist?.id === playlistKey) {
      setSelectedPlaylist(null);
    }
    await loadFromVault();
  };

  // The Crate Builder: Generate [Artist] Station
  const handleGenerateStation = async () => {
    if (!stationArtist.trim()) return;
    const query = stationArtist.trim().toLowerCase();
    const allTracks = await getAllVaultTracks();

    const matched = allTracks.filter(
      (t) => (t.artist || "").toLowerCase().includes(query) || (t.genre || "").toLowerCase().includes(query)
    );

    const stationTracks = matched.slice(0, 50);
    const playlistKey = `station:${Date.now()}`;
    const stationName = `${stationArtist.trim()} Station`;

    await vaultDb.playlists.put({
      playlistKey,
      name: stationName,
      platform: "custom",
      curator: "The Crate Builder",
      trackCount: stationTracks.length,
      isCustom: true,
      sortOrder: Date.now()
    });

    const links = stationTracks.map((t, idx) => ({
      playlistKey,
      trackKey: t.trackKey,
      position: idx
    }));
    await vaultDb.playlistTracks.bulkPut(links);

    setStationArtist("");
    setIsCrateBuilderOpen(false);
    await loadFromVault();
  };

  const handleSelectPlaylist = async (playlist) => {
    setSelectedPlaylist({ ...playlist, tracks: [], loaded: false });
    const rows = await getPlaylistTracks(playlist.id);
    const tracks = rows.map((t) => ({
      id: t.trackKey,
      title: t.title,
      artist: t.artist,
      duration: formatDuration(t.durationMs)
    }));
    setSelectedPlaylist((prev) => (prev && prev.id === playlist.id ? { ...prev, tracks, loaded: true } : prev));
  };

  const handleArchive = async (playlist, archived) => {
    await setPlaylistArchived(playlist.id, archived);
    await loadFromVault();
    setSelectedPlaylist(null);
  };

  const matchesSearch = (text) => (text || "").toLowerCase().includes(searchQuery.toLowerCase());
  const filteredSongs = libraryData.songs.filter((s) => matchesSearch(s.title) || matchesSearch(s.artist));
  const activePlaylists = libraryData.playlists.filter((p) => !p.isArchived);
  const archivedPlaylists = libraryData.playlists.filter((p) => p.isArchived);
  const filteredPlaylists = (showArchived ? archivedPlaylists : activePlaylists).filter(
    (p) => matchesSearch(p.name) || matchesSearch(p.curator)
  );
  const filteredAlbums = libraryData.albums.filter((a) => matchesSearch(a.title) || matchesSearch(a.artist));

  const syncButtonDisabled = isSyncing || cooldownSeconds > 0 || !spotifyConnected;
  const isShell = (pl) => !!pl && !!pl.isShell;

  return (
    <div className="library-screen" style={{ position: "relative" }}>

      {/* Sync Status Modal */}
      {isSyncing && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "16px", padding: "32px", width: "420px", textAlign: "center", color: "#fff" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px 0" }}>{syncStatusText}</h2>
            <p style={{ fontSize: "14px", color: "#a1a1aa", margin: "0 0 24px 0" }}>{syncProgress.currentTrack || "Syncing metadata..."}</p>
            <button onClick={handleStopSync} style={{ ...smallButtonStyle, marginTop: "20px" }}>Stop</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Gapviz Only) */}
      {deleteConfirmPlaylist && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.8)", zIndex: 99998, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#18181b", border: "1px solid #ff3344", borderRadius: "12px", padding: "24px", width: "400px", color: "#fff", textAlign: "center" }}>
            <h3 style={{ color: "#ff3344", marginBottom: "12px" }}>Delete Playlist from Gapviz?</h3>
            <p style={{ fontSize: "14px", color: "#d4d4d8", marginBottom: "20px" }}>
              This will remove <strong>{deleteConfirmPlaylist.name}</strong> from your Gapviz vault only. Your actual Spotify account and playlists remain completely untouched.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button onClick={() => setDeleteConfirmPlaylist(null)} style={smallButtonStyle}>Cancel</button>
              <button onClick={handleDeleteGapvizPlaylist} style={{ ...smallButtonStyle, background: "#ff3344", border: "none", color: "#fff" }}>Delete from Gapviz</button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {editingPlaylist && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.8)", zIndex: 99998, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#18181b", border: "1px solid #444", borderRadius: "12px", padding: "24px", width: "400px", color: "#fff" }}>
            <h3 style={{ marginBottom: "12px" }}>Rename Playlist</h3>
            <input type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#27272a", border: "1px solid #52525b", color: "#fff", marginBottom: "16px" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => setEditingPlaylist(null)} style={smallButtonStyle}>Cancel</button>
              <button onClick={handleRenamePlaylist} style={{ ...smallButtonStyle, background: "#1db954", border: "none", color: "#000", fontWeight: "bold" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Crate Builder Modal */}
      {isCrateBuilderOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.8)", zIndex: 99998, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#18181b", border: "1px solid #1db954", borderRadius: "12px", padding: "24px", width: "420px", color: "#fff" }}>
            <h3 style={{ marginBottom: "8px", color: "#1db954" }}><i className="fa-solid fa-radio"></i> The Crate Builder</h3>
            <p style={{ fontSize: "13px", color: "#a1a1aa", marginBottom: "16px" }}>Enter an artist name to build a 50-track smart station based on their vault tracks and era.</p>
            <input type="text" placeholder="e.g. Duran Duran" value={stationArtist} onChange={(e) => setStationArtist(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#27272a", border: "1px solid #52525b", color: "#fff", marginBottom: "16px" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => setIsCrateBuilderOpen(false)} style={smallButtonStyle}>Cancel</button>
              <button onClick={handleGenerateStation} style={{ ...smallButtonStyle, background: "#1db954", border: "none", color: "#000", fontWeight: "bold" }}>Build Station</button>
            </div>
          </div>
        </div>
      )}

      {/* Header Deck */}
      <div className="library-header">
        <h1>Master Library</h1>
        <p className="library-subtitle">Your aggregated multi-platform music vault, identified tracks & saved lore</p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
          <button onClick={handleSync} disabled={syncButtonDisabled} style={{ background: syncButtonDisabled ? "#2a2a2e" : "#1db954", color: syncButtonDisabled ? "#777" : "#000", border: "none", borderRadius: "6px", padding: "8px 16px", fontWeight: 700, cursor: syncButtonDisabled ? "not-allowed" : "pointer" }}>
            <i className="fa-solid fa-rotate"></i> Sync Spotify
          </button>
          {lastSyncAt && <span style={{ color: "#71717a", fontSize: "12px" }}>Last synced {new Date(lastSyncAt).toLocaleString()}</span>}
        </div>
        {syncNotice && <p style={{ marginTop: "12px", padding: "10px", borderRadius: "6px", background: "rgba(255, 51, 68, 0.12)", color: "#fca5a5", fontSize: "13px" }}>{syncNotice}</p>}
      </div>

      {/* Search Bar */}
      <div className="library-search-container">
        <i className="fa-solid fa-magnifying-glass search-icon"></i>
        <input type="text" placeholder="Search library by title, artist, or tag..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="library-search-input" />
      </div>

      {/* Tab Navigation */}
      <div className="library-tabs">
        <button className={`library-tab-btn ${activeTab === "playlists" ? "active" : ""}`} onClick={() => { setActiveTab("playlists"); setSelectedPlaylist(null); }}>
          <i className="fa-solid fa-list"></i> Playlists ({activePlaylists.length})
        </button>
        <button className={`library-tab-btn ${activeTab === "inbox" ? "active" : ""}`} onClick={() => setActiveTab("inbox")}>
          <i className="fa-solid fa-inbox"></i> Identify Inbox ({libraryData.inbox.length})
        </button>
        <button className={`library-tab-btn ${activeTab === "albums" ? "active" : ""}`} onClick={() => setActiveTab("albums")}>
          <i className="fa-solid fa-compact-disc"></i> Albums ({libraryData.albums.length})
        </button>
        <button className={`library-tab-btn ${activeTab === "songs" ? "active" : ""}`} onClick={() => setActiveTab("songs")}>
          <i className="fa-solid fa-music"></i> Songs ({libraryData.songs.length})
        </button>
        <button className={`library-tab-btn ${activeTab === "identified" ? "active" : ""}`} onClick={() => setActiveTab("identified")}>
          <i className="fa-solid fa-ear-listen"></i> Identified ({libraryData.identified.length})
        </button>
        <button className={`library-tab-btn ${activeTab === "commentary" ? "active" : ""}`} onClick={() => setActiveTab("commentary")}>
          <i className="fa-solid fa-microphone-lines"></i> Commentary Vault ({libraryData.commentaryVault.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="library-content-container">
        {activeTab === "playlists" && !selectedPlaylist && (
          <div className="playlists-wrapper">
            <div className="create-playlist-trigger-bar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "20px" }}>
              <button className="create-playlist-btn" onClick={() => setIsCreatingPlaylist(!isCreatingPlaylist)}>
                <i className="fa-solid fa-plus"></i> Create New Playlist
              </button>
              <button style={{ ...smallButtonStyle, background: "#18181b", borderColor: "#1db954", color: "#1db954" }} onClick={() => setIsCrateBuilderOpen(true)}>
                <i className="fa-solid fa-radio"></i> The Crate Builder
              </button>
              {(archivedPlaylists.length > 0 || showArchived) && (
                <button style={smallButtonStyle} onClick={() => setShowArchived(!showArchived)}>
                  {showArchived ? "Back to Playlists" : `Archived (${archivedPlaylists.length})`}
                </button>
              )}
            </div>

            {isCreatingPlaylist && (
              <div className="playlist-creator-card" style={{ background: "#18181b", border: "1px solid #444", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ marginBottom: "12px" }}>Build New Playlist</h3>
                <input type="text" placeholder="e.g. Cafe Discoveries" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#27272a", border: "1px solid #52525b", color: "#fff", marginBottom: "12px" }} />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={handleSaveNewPlaylist} style={{ ...smallButtonStyle, background: "#1db954", border: "none", color: "#000", fontWeight: "bold" }}>Save & Build</button>
                  <button onClick={() => setIsCreatingPlaylist(false)} style={smallButtonStyle}>Cancel</button>
                </div>
              </div>
            )}

            <div className="library-grid">
              {filteredPlaylists.length === 0 ? (
                <p style={{ color: "#aaa", padding: "20px" }}>No playlists found.</p>
              ) : (
                filteredPlaylists.map((item) => (
                  <div key={item.id} className="library-card" style={{ position: "relative" }}>
                    <div onClick={() => handleSelectPlaylist(item)} style={{ cursor: "pointer" }}>
                      <div className="card-top-row">
                        <span className="card-badge-label">{item.isCustom ? "CUSTOM" : item.isShell && item.spotifyOwned ? "SPOTIFY-MADE" : "PLAYLIST"}</span>
                        <div className="platform-badges">{item.platforms.join(" ")}</div>
                      </div>
                      <h3>{item.name}</h3>
                      <p className="card-subtext">{item.curator} • {item.count} Tracks</p>
                    </div>
                    {/* Inline management buttons */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px" }}>
                      <button onClick={(e) => { e.stopPropagation(); setEditingPlaylist(item); setRenameValue(item.name); }} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", fontSize: "12px" }}>
                        <i className="fa-solid fa-pen"></i> Rename
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmPlaylist(item); }} style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", fontSize: "12px", marginLeft: "auto" }}>
                        <i className="fa-solid fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "playlists" && selectedPlaylist && (
          <div className="playlist-detail-view">
            <button className="back-btn" onClick={() => setSelectedPlaylist(null)} style={{ ...smallButtonStyle, marginBottom: "20px" }}>
              <i className="fa-solid fa-arrow-left"></i> Back to Playlists
            </button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "8px" }}>
              <h2 style={{ margin: 0 }}>{selectedPlaylist.name}</h2>
              <button onClick={() => { setEditingPlaylist(selectedPlaylist); setRenameValue(selectedPlaylist.name); }} style={{ ...smallButtonStyle, padding: "4px 10px", fontSize: "12px" }}>
                <i className="fa-solid fa-pen"></i> Rename
              </button>
            </div>
            <p style={{ color: "#aaa", marginBottom: "20px" }}>{selectedPlaylist.curator} • {selectedPlaylist.tracks?.length || selectedPlaylist.count || 0} Tracks</p>

            <div className="library-list-stack">
              {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 ? (
                selectedPlaylist.tracks.map((track, idx) => (
                  <div key={`${track.id}-${idx}`} className="library-row-item">
                    <div className="row-item-left">
                      <span className="row-platform">🟢</span>
                      <div className="row-text-group">
                        <span className="row-song-title">{track.title}</span>
                        <span className="row-song-artist">{track.artist}</span>
                      </div>
                    </div>
                    <span className="row-duration">{track.duration}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: "#aaa" }}>No tracks saved for this playlist yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "songs" && (
          <div className="library-list-stack">
            {filteredSongs.map((item) => (
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

        {activeTab === "albums" && (
          <div className="library-grid">
            {filteredAlbums.map((item) => (
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