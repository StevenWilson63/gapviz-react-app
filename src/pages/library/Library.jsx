// src/pages/library/Library.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MusicApiService,
  syncSpotifyLibrary,
  getSyncInfo,
  SpotifyRateLimitError,
  SpotifyAuthError
} from "../../services/musicApi";
import { getAllVaultTracks, getVaultPlaylists, getPlaylistTracks } from "../../services/vaultDb";
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

  // Sync Progress Status States (Centered & Pulsing)
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState("Connecting to Spotify & syncing metadata...");
  const [syncProgress, setSyncProgress] = useState({ processed: 0, total: 0, percent: 5, currentTrack: "" });
  const [syncNotice, setSyncNotice] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState(null);

  const abortRef = useRef(null);
  const spotifyConnected = MusicApiService.getConnectedTokens().spotify;

  // Master Library Data State
  const [libraryData, setLibraryData] = useState({
    playlists: [],
    albums: [],
    songs: [],
    identified: [],
    inbox: [],
    commentaryVault: []
  });

  // Everything shown on this page comes from the local vault (IndexedDB), never straight from Spotify
  const loadFromVault = useCallback(async () => {
    const [playlists, tracks] = await Promise.all([getVaultPlaylists("spotify"), getAllVaultTracks()]);

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
      playlists: playlists.map((pl) => ({
        id: pl.playlistKey,
        name: pl.name,
        count: pl.trackCount || 0,
        platforms: ["🟢"],
        curator: pl.curator,
        restricted: !!pl.restricted
      })),
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
    if (info.cooldownSeconds > 0) {
      setSyncNotice(
        `Spotify has asked Gapviz to pause. Everything fetched so far is saved. You can sync again in about ${formatWait(info.cooldownSeconds)}.`
      );
    }
  }, []);

  // On mount: only read the local vault. This page never starts a Spotify sync by itself.
  useEffect(() => {
    // Remove the old localStorage playlist cache; the vault replaces it
    localStorage.removeItem("gapviz_spotify_playlists_cache");

    loadFromVault().catch((err) => console.error(">>> [Library] Failed to read vault:", err));
    refreshSyncInfo().catch(() => {});

    return () => abortRef.current?.abort();
  }, [loadFromVault, refreshSyncInfo]);

  // Manual sync: resumes from the last checkpoint, respects Spotify's cooldown
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

      if (controller.signal.aborted) {
        setIsSyncing(false);
        setSyncNotice("Sync stopped. Press Sync Spotify to carry on where it left off.");
        return;
      }

      setSyncStatusText("Transfer Complete");
      setSyncProgress((prev) => ({ ...prev, percent: 100 }));
      setTimeout(() => setIsSyncing(false), 1500);
    } catch (err) {
      console.error(">>> [Library] Sync stopped:", err);
      await loadFromVault().catch(() => {});
      await refreshSyncInfo().catch(() => {});
      setIsSyncing(false);

      if (err instanceof SpotifyRateLimitError) {
        setSyncNotice(
          `Spotify asked Gapviz to pause. Everything fetched so far is saved. Try again in about ${formatWait(err.retryAfterSec)} and it will carry on where it stopped.`
        );
      } else if (err instanceof SpotifyAuthError) {
        setSyncNotice("Your Spotify connection has expired. Reconnect it under Profile > Connected Services, then sync again.");
      } else {
        setSyncNotice(`Sync stopped: ${err.message}. Your progress is saved. Press Sync Spotify to resume.`);
      }
    }
  };

  const handleStopSync = () => abortRef.current?.abort();

  const handleSaveNewPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    setIsCreatingPlaylist(false);
    setNewPlaylistName("");
  };

  // Playlist tracks come from the local vault: no Spotify request when a playlist is clicked
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

  // Filter songs and playlists based on search query
  const filteredSongs = libraryData.songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlaylists = libraryData.playlists.filter(
    (playlist) =>
      playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playlist.curator?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAlbums = libraryData.albums.filter(
    (album) =>
      album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      album.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const syncButtonDisabled = isSyncing || cooldownSeconds > 0 || !spotifyConnected;

  return (
    <div className="library-screen" style={{ position: "relative" }}>

      {/* Centered, Prominent, Pulsing "On Air" Sync Status Modal */}
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
            maxWidth: "90vw",
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

            <p style={{ fontSize: "14px", color: "#a1a1aa", margin: "0 0 24px 0", minHeight: "20px" }}>
              {syncProgress.currentTrack || "Aggregating metadata vault securely in browser storage..."}
            </p>

            <div style={{ background: "rgba(255, 255, 255, 0.1)", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
              <div style={{
                background: "#1db954",
                height: "100%",
                width: `${syncStatusText === "Transfer Complete" ? 100 : (syncProgress.percent || 5)}%`,
                transition: "width 0.3s ease"
              }}></div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#71717a" }}>
              <span>{syncStatusText === "Transfer Complete" ? "Vault synchronized" : "Transferring metadata records"}</span>
              <span>{syncStatusText === "Transfer Complete" ? "100%" : `${syncProgress.percent || 5}%`}</span>
            </div>

            {syncStatusText !== "Transfer Complete" && (
              <button
                onClick={handleStopSync}
                style={{ marginTop: "20px", background: "none", border: "1px solid #444", color: "#fff", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}
              >
                Stop (progress is saved)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header Deck */}
      <div className="library-header">
        <h1>Master Library</h1>
        <p className="library-subtitle">Your aggregated multi-platform music vault, identified tracks & saved lore</p>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
          <button
            onClick={handleSync}
            disabled={syncButtonDisabled}
            style={{
              background: syncButtonDisabled ? "#2a2a2e" : "#1db954",
              color: syncButtonDisabled ? "#777" : "#000",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontWeight: 700,
              cursor: syncButtonDisabled ? "not-allowed" : "pointer"
            }}
          >
            <i className="fa-solid fa-rotate"></i> Sync Spotify
          </button>
          {lastSyncAt && (
            <span style={{ color: "#71717a", fontSize: "12px" }}>
              Last synced {new Date(lastSyncAt).toLocaleString()}
            </span>
          )}
        </div>

        {syncNotice && (
          <p style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "6px", background: "rgba(255, 51, 68, 0.12)", border: "1px solid rgba(255, 51, 68, 0.4)", color: "#fca5a5", fontSize: "13px" }}>
            {syncNotice}
          </p>
        )}
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
                <p style={{ color: "#aaa", padding: "20px" }}>
                  {spotifyConnected
                    ? "No playlists in your vault yet. Press Sync Spotify to import your library."
                    : "No playlists found. Connect Spotify in your profile to sync your playlists."}
                </p>
              ) : (
                filteredPlaylists.map((item) => (
                  <div
                    key={item.id}
                    className="library-card"
                    onClick={() => handleSelectPlaylist(item)}
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

        {/* When viewing a selected playlist */}
{selectedPlaylist && (
  <div className="playlist-detail-view">
    <button className="back-to-playlists-btn" onClick={() => setSelectedPlaylist(null)}>
      <i className="fa-solid fa-arrow-left"></i> Back to Playlists
    </button>
    
    <div className="playlist-detail-header">
      <h2>{selectedPlaylist.name}</h2>
      <p>Curated by: {selectedPlaylist.curator} • {selectedPlaylist.count} tracks</p>
    </div>

    {/* RESTRICTED EDITORIAL SHELL BANNER */}
    {selectedPlaylist.restricted ? (
      <div style={{
        background: "rgba(29, 185, 84, 0.1)",
        border: "1px solid rgba(29, 185, 84, 0.4)",
        borderRadius: "12px",
        padding: "24px",
        margin: "24px 0",
        textAlign: "center",
        color: "#fff"
      }}>
        <i className="fa-solid fa-lock" style={{ fontSize: "28px", color: "#1db954", marginBottom: "12px" }}></i>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>Spotify-Curated Playlist</h3>
        <p style={{ color: "#a1a1aa", fontSize: "14px", lineHeight: "1.6", maxWidth: "500px", margin: "0 auto 16px auto" }}>
          To sync this Spotify-created playlist, open the playlist in Spotify, select all tracks, choose <strong>Add to playlist</strong> ➔ <strong>New playlist</strong>. Re-sync in Gapviz!
        </p>
        <span style={{ fontSize: "12px", color: "#71717a" }}>
          You can delete or archive this shell from your library at any time.
        </span>
      </div>
    ) : (
      /* Standard Track Table / List */
      <div className="playlist-tracks-list">
        {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 ? (
          selectedPlaylist.tracks.map((track, idx) => (
            <div key={track.id || idx} className="track-row">
              <span className="track-number">{idx + 1}</span>
              <div className="track-info">
                <span className="track-title">{track.title}</span>
                <span className="track-artist">{track.artist}</span>
              </div>
              <span className="track-album">{track.album}</span>
            </div>
          ))
        ) : (
          <p className="no-tracks-msg">No tracks found in this playlist vault.</p>
        )}
      </div>
    )}
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

        {/* ALBUMS TAB (built from the albums your synced tracks belong to) */}
        {activeTab === "albums" && (
          <div className="library-grid">
            {filteredAlbums.length === 0 ? (
              <p style={{ color: "#aaa", padding: "20px" }}>No albums yet. They appear here once your tracks are synced.</p>
            ) : (
              filteredAlbums.map((item) => (
                <div key={item.id} className="library-card">
                  <div className="card-top-row">
                    <span className="card-badge-label">ALBUM ({item.year})</span>
                    <span className="platform-badge">{item.platform}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="card-subtext">{item.artist} • {item.tracks} Tracks in your library</p>
                </div>
              ))
            )}
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