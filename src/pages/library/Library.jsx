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
  requeuePlaylist
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

  // New Playlist Modal/Inline Form State
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["🟢"]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  // Sync Progress Status States (Centered & Pulsing)
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState("Connecting to Spotify & syncing metadata...");
  const [syncProgress, setSyncProgress] = useState({ processed: 0, total: 0, percent: 5, currentTrack: "" });
  const [syncNotice, setSyncNotice] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [hiddenPlaylists, setHiddenPlaylists] = useState(0);

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
    const [playlists, tracks, trackCounts] = await Promise.all([
      getVaultPlaylists("spotify"),
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
          platforms: ["🟢"],
          curator: pl.curator,
          spotifyOwned: !!pl.spotifyOwned,
          // A shell is a playlist Gapviz tried to read, was refused, and holds no tracks for.
          // Anything with imported tracks is always shown as a normal playlist.
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

  // Archive hides a playlist; it stays hidden across re-syncs (deleting would just bring it back)
  const handleArchive = async (playlist, archived) => {
    await setPlaylistArchived(playlist.id, archived);
    await loadFromVault();
    setSelectedPlaylist(null);
  };

  // Ask the next sync to try reading this playlist again
  const handleRetry = async (playlist) => {
    await requeuePlaylist(playlist.id);
    setSelectedPlaylist(null);
    setSyncNotice(`"${playlist.name}" will be tried again. Press Sync Spotify to do it now.`);
  };

  const matchesSearch = (text) => (text || "").toLowerCase().includes(searchQuery.toLowerCase());

  // Filter songs and playlists based on search query
  const filteredSongs = libraryData.songs.filter(
    (song) => matchesSearch(song.title) || matchesSearch(song.artist)
  );

  const activePlaylists = libraryData.playlists.filter((p) => !p.isArchived);
  const archivedPlaylists = libraryData.playlists.filter((p) => p.isArchived);

  const filteredPlaylists = (showArchived ? archivedPlaylists : activePlaylists).filter(
    (playlist) => matchesSearch(playlist.name) || matchesSearch(playlist.curator)
  );

  const filteredAlbums = libraryData.albums.filter(
    (album) => matchesSearch(album.title) || matchesSearch(album.artist)
  );

  const syncButtonDisabled = isSyncing || cooldownSeconds > 0 || !spotifyConnected;
  const isShell = (pl) => !!pl && !!pl.isShell;

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
              <button onClick={handleStopSync} style={{ ...smallButtonStyle, marginTop: "20px" }}>
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

        {hiddenPlaylists > 0 && (
          <p style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.06)", border: "1px solid #444", color: "#d4d4d8", fontSize: "13px" }}>
            Spotify did not share {hiddenPlaylists} {hiddenPlaylists === 1 ? "playlist" : "playlists"} from your account with Gapviz, so {hiddenPlaylists === 1 ? "it" : "they"} can't appear here. Copying the tracks into your own playlist in Spotify will bring them in on the next sync.
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
          <i className="fa-solid fa-list"></i> Playlists ({activePlaylists.length})
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
            <div className="create-playlist-trigger-bar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <button
                className="create-playlist-btn"
                onClick={() => setIsCreatingPlaylist(!isCreatingPlaylist)}
              >
                <i className="fa-solid fa-plus"></i> Create New Playlist
              </button>
              {(archivedPlaylists.length > 0 || showArchived) && (
                <button style={smallButtonStyle} onClick={() => setShowArchived(!showArchived)}>
                  {showArchived ? "Back to Playlists" : `Archived (${archivedPlaylists.length})`}
                </button>
              )}
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
                  {showArchived
                    ? "No archived playlists."
                    : spotifyConnected
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
                      <span className="card-badge-label">{item.isShell && item.spotifyOwned ? "SPOTIFY-MADE" : "PLAYLIST"}</span>
                      <div className="platform-badges">{Array.isArray(item.platforms) ? item.platforms.join(" ") : item.platforms}</div>
                    </div>
                    <h3>{item.name}</h3>
                    <p className="card-subtext">
                      {item.curator} • {isShell(item) ? "Tracks not imported" : `${item.count} Tracks`}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* DETAILED PLAYLIST VIEW WHEN CLICKED */}
        {activeTab === "playlists" && selectedPlaylist && (
          <div className="playlist-detail-view">
            <button className="back-btn" onClick={() => setSelectedPlaylist(null)} style={{ ...smallButtonStyle, marginBottom: "20px" }}>
              <i className="fa-solid fa-arrow-left"></i> Back to Playlists
            </button>
            <h2>{selectedPlaylist.name}</h2>
            <p style={{ color: "#aaa", marginBottom: "20px" }}>
              {selectedPlaylist.curator} • {isShell(selectedPlaylist) ? "Tracks not imported" : `${selectedPlaylist.tracks?.length || selectedPlaylist.count || 0} Tracks`}
            </p>

            {/* Shell view: playlists Spotify won't let Gapviz read */}
            {isShell(selectedPlaylist) && (
              <div style={{ padding: "16px 20px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid #444", color: "#d4d4d8", fontSize: "14px", lineHeight: 1.5, marginBottom: "20px" }}>
                <strong style={{ color: "#fff" }}>
                  {selectedPlaylist.spotifyOwned ? "Spotify made this playlist" : "Gapviz couldn't read this playlist's tracks"}
                </strong>
                <p style={{ margin: "8px 0" }}>
                  {selectedPlaylist.spotifyOwned
                    ? "Spotify doesn't let apps like Gapviz read the tracks in playlists it makes itself, such as radio playlists and Daily Mixes. Gapviz keeps it here so you can still find it. To bring its tracks into Gapviz:"
                    : "Spotify refused to share this playlist's tracks with Gapviz. You can try importing it again, or bring its tracks in yourself:"}
                </p>
                <ol style={{ margin: "8px 0 8px 20px", padding: 0 }}>
                  <li>Open the playlist in Spotify on a computer.</li>
                  <li>Click any track, select them all (Ctrl+A, or Cmd+A on a Mac), right-click and choose Add to playlist, then New playlist.</li>
                  <li>Come back here and press Sync Spotify. Your copy arrives as a normal playlist with every track.</li>
                  <li>Archive this one if you no longer need it.</li>
                </ol>
                <p style={{ margin: "8px 0", color: "#a1a1aa", fontSize: "13px" }}>
                  Your copy is a snapshot. It won't change when Spotify refreshes the original.
                </p>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
                  {!selectedPlaylist.spotifyOwned && (
                    <button style={smallButtonStyle} onClick={() => handleRetry(selectedPlaylist)}>
                      Try importing again
                    </button>
                  )}
                  <a href={spotifyPlaylistUrl(selectedPlaylist.id)} target="_blank" rel="noopener noreferrer" style={smallButtonStyle}>
                    <i className="fa-brands fa-spotify"></i> Open in Spotify
                  </a>
                  <button
                    style={smallButtonStyle}
                    onClick={() => handleArchive(selectedPlaylist, !selectedPlaylist.isArchived)}
                  >
                    {selectedPlaylist.isArchived ? "Restore to library" : "Archive this playlist"}
                  </button>
                </div>
              </div>
            )}

            {!isShell(selectedPlaylist) && (
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
                ) : !selectedPlaylist.loaded ? (
                  <p style={{ color: "#aaa" }}>Loading tracks from your vault...</p>
                ) : (
                  <p style={{ color: "#aaa" }}>No tracks saved for this playlist yet. Press Sync Spotify to import them.</p>
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