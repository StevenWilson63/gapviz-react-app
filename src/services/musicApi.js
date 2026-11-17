// src/services/musicApi.js

import { vaultDb, buildTrackKey } from "./vaultDb";
import { saveTrackPage } from "./syncEngine";

const TOKEN_STORAGE_KEY = "gapviz_connected_services_tokens";
const SPOTIFY_TOKEN_KEY = "gapviz_spotify_access_token";
const SPOTIFY_REFRESH_KEY = "gapviz_spotify_refresh_token";
const SPOTIFY_EXPIRES_KEY = "gapviz_spotify_token_expires_at";
const COOLDOWN_KEY = "gapviz_spotify_cooldown_until";

const LIKED_KEY = "spotify:liked";
const SYNC_KEY = "spotify";

const CLIENT_IDS = {
  spotify: "c75bf5ba6c1b4d1c897ca910d171bd5c",
  tidal: "mock_tidal_client_id"
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class SpotifyRateLimitError extends Error {
  constructor(retryAfterSec) {
    super(`Spotify rate limit hit. Try again in ${Math.ceil(retryAfterSec / 60)} min.`);
    this.name = "SpotifyRateLimitError";
    this.retryAfterSec = retryAfterSec;
  }
}

export class SpotifyAuthError extends Error {
  constructor(message = "Your Spotify connection has expired. Please reconnect.") {
    super(message);
    this.name = "SpotifyAuthError";
  }
}

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

const generateRandomString = (length) => {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
};

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Token handling
// ---------------------------------------------------------------------------

function storeTokens(data) {
  localStorage.setItem(SPOTIFY_TOKEN_KEY, data.access_token);
  if (data.refresh_token) localStorage.setItem(SPOTIFY_REFRESH_KEY, data.refresh_token);
  localStorage.setItem(SPOTIFY_EXPIRES_KEY, String(Date.now() + (data.expires_in || 3600) * 1000));
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(SPOTIFY_REFRESH_KEY);
  if (!refreshToken) throw new SpotifyAuthError();

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_IDS.spotify
    })
  });
  if (!res.ok) throw new SpotifyAuthError();

  const data = await res.json();
  if (!data.access_token) throw new SpotifyAuthError();
  storeTokens(data);
  return data.access_token;
}

async function getValidToken() {
  const token = localStorage.getItem(SPOTIFY_TOKEN_KEY);
  const expiresAt = Number(localStorage.getItem(SPOTIFY_EXPIRES_KEY) || 0);

  if (token && (!expiresAt || Date.now() < expiresAt - 60000)) return token;
  if (localStorage.getItem(SPOTIFY_REFRESH_KEY)) return refreshAccessToken();
  if (token) return token;
  throw new SpotifyAuthError("Spotify is not connected.");
}

// ---------------------------------------------------------------------------
// Rate-limit-safe request gateway
// ---------------------------------------------------------------------------

const MIN_GAP_MS = 400;
let lastRequestAt = 0;

export function getCooldownSeconds() {
  const until = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

async function spotifyFetch(url, options = {}) {
  const remaining = getCooldownSeconds();
  if (remaining > 0) throw new SpotifyRateLimitError(remaining);

  const gap = lastRequestAt + MIN_GAP_MS - Date.now();
  if (gap > 0) await sleep(gap);

  let token = await getValidToken();
  lastRequestAt = Date.now();
  let res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (res.status === 401) {
    token = await refreshAccessToken();
    lastRequestAt = Date.now();
    res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
    if (res.status === 401) throw new SpotifyAuthError();
  }

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After")) || 900;
    localStorage.setItem(COOLDOWN_KEY, String(Date.now() + retryAfter * 1000));
    throw new SpotifyRateLimitError(retryAfter);
  }

  return res;
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

const mapTrack = (tr, addedAt) => ({
  id: tr.id,
  title: tr.name,
  artist: tr.artists?.map((a) => a.name).join(", ") || "Unknown Artist",
  album: tr.album?.name || "Single",
  artworkUrl: tr.album?.images?.[0]?.url || "",
  durationMs: tr.duration_ms || 0,
  uri: tr.uri || "",
  releaseYear: tr.album?.release_date ? Number(tr.album.release_date.slice(0, 4)) : null,
  addedAt: addedAt ? Date.parse(addedAt) : Date.now()
});

// ---------------------------------------------------------------------------
// Automated In-App Clone Helper for 403 Restricted Playlists
// ---------------------------------------------------------------------------

async function autoCloneRestrictedPlaylist(sourcePlaylistId, playlistName) {
  try {
    const meRes = await spotifyFetch("https://api.spotify.com/v1/me");
    if (!meRes.ok) return false;
    const meData = await meRes.json();
    const userId = meData.id;

    let trackUris = [];
    const sourceRes = await fetch(`https://api.spotify.com/v1/playlists/${sourcePlaylistId}`);
    if (sourceRes.ok) {
      const sourceData = await sourceRes.json();
      trackUris = (sourceData.tracks?.items || [])
        .map(item => item.track?.uri)
        .filter(Boolean);
    }

    if (trackUris.length === 0) return false;

    const createRes = await spotifyFetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${playlistName} (Gapviz Cloned)`,
        public: false,
        description: "Automatically cloned by Gapviz vault sync assistant."
      })
    });

    if (!createRes.ok) return false;
    const newPlaylistData = await createRes.json();
    const newPlaylistId = newPlaylistData.id;

    for (let i = 0; i < trackUris.length; i += 100) {
      const batch = trackUris.slice(i, i + 100);
      await spotifyFetch(`https://api.spotify.com/v1/playlists/${newPlaylistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uris: batch })
      });
    }
    return true;
  } catch (err) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Resumable sync
// ---------------------------------------------------------------------------

async function getState() {
  return (await vaultDb.syncState.get(SYNC_KEY)) || { key: SYNC_KEY };
}

async function patchState(patch) {
  const next = { ...(await getState()), ...patch, key: SYNC_KEY };
  await vaultDb.syncState.put(next);
  return next;
}

export async function getSyncInfo() {
  const state = await getState();
  return {
    cooldownSeconds: getCooldownSeconds(),
    lastSyncAt: state.lastSyncAt || null,
    inProgress: !!state.inProgress
  };
}

let syncInFlight = null;

export function syncSpotifyLibrary(opts) {
  if (!syncInFlight) {
    syncInFlight = runSpotifySync(opts).finally(() => {
      syncInFlight = null;
    });
  }
  return syncInFlight;
}

async function runSpotifySync({ onProgress, signal } = {}) {
  let state = await getState();

  if (!state.inProgress) {
    state = await patchState({
      inProgress: true,
      phase: "playlists",
      playlistsNext: null,
      likedNext: null,
      likedFetched: 0,
      likedTotal: 0,
      incremental: !!state.lastSyncAt
    });
  }

  // ---- PHASE 1: playlist list with diagnostic console logging ----
  if (state.phase === "playlists") {
    let url = state.playlistsNext || "https://api.spotify.com/v1/me/playlists?limit=50";
    while (url) {
      if (signal?.aborted) return;
      const res = await spotifyFetch(url);
      if (!res.ok) throw new Error(`Spotify playlist list failed (${res.status})`);
      const data = await res.json();

      const items = (data.items || []).filter(Boolean);
      
      console.log(">>> [Spotify Sync] Playlists fetched from Spotify:", items.map(p => p.name));

      const keys = items.map((pl) => `spotify:${pl.id}`);
      const prevRows = await vaultDb.playlists.where("playlistKey").anyOf(keys).toArray();
      const prevByKey = new Map(prevRows.map((p) => [p.playlistKey, p]));

      const rows = items.map((pl, i) => {
        const playlistKey = keys[i];
        const prev = prevByKey.get(playlistKey);
        const row = {
          ...(prev || {}),
          playlistKey,
          name: pl.name,
          platform: "spotify",
          curator: pl.owner?.display_name || "Spotify",
          trackCount: pl.items?.total ?? pl.tracks?.total ?? prev?.trackCount ?? 0,
          snapshotId: pl.snapshot_id,
          syncedSnapshotId: prev?.syncedSnapshotId || null,
          sortOrder: (data.offset || 0) + i + 1,
          isPinned: prev?.isPinned || 0
        };
        if (prev) row.id = prev.id;
        return row;
      });
      await vaultDb.playlists.bulkPut(rows);

      url = data.next;
      await patchState({ playlistsNext: url });
      onProgress?.({ currentTrack: "Reading your playlists...", percent: 8 });
    }

    const likedPrev = await vaultDb.playlists.where("playlistKey").equals(LIKED_KEY).first();
    const likedRow = {
      ...(likedPrev || {}),
      playlistKey: LIKED_KEY,
      name: "Liked Songs",
      platform: "spotify",
      curator: "Spotify Saved Library",
      trackCount: likedPrev?.trackCount || 0,
      snapshotId: "liked",
      syncedSnapshotId: "liked",
      sortOrder: 0,
      isPinned: 1
    };
    if (likedPrev) likedRow.id = likedPrev.id;
    await vaultDb.playlists.put(likedRow);

    state = await patchState({ phase: "liked" });
  }

  // ---- PHASE 2: Liked Songs ----
  if (state.phase === "liked") {
    let url = state.likedNext || "https://api.spotify.com/v1/me/tracks?limit=50";
    let fetched = state.likedFetched || 0;
    let total = state.likedTotal || 0;

    while (url) {
      if (signal?.aborted) return;
      const res = await spotifyFetch(url);
      if (!res.ok) throw new Error(`Spotify liked songs failed (${res.status})`);
      const data = await res.json();
      total = data.total ?? total;

      const tracks = (data.items || [])
        .filter((i) => i?.track?.name)
        .map((i) => mapTrack(i.track, i.added_at));

      if (state.incremental && tracks.length > 0) {
        const keys = tracks.map((t) => buildTrackKey("spotify", t.id, t.title, t.artist));
        const links = await vaultDb.playlistTracks.bulkGet(keys.map((k) => [LIKED_KEY, k]));
        if (links.every(Boolean)) {
          url = null;
          break;
        }
      }

      await saveTrackPage({
        platform: "spotify",
        playlistKey: LIKED_KEY,
        tracks,
        offset: data.offset || 0
      });

      fetched += tracks.length;
      url = data.next;
      await patchState({ likedNext: url, likedFetched: fetched, likedTotal: total });
      onProgress?.({
        currentTrack: `Liked Songs: ${fetched} of ${total}`,
        percent: 10 + Math.round((fetched / Math.max(total, 1)) * 40)
      });
    }

    if (total > 0) {
      await vaultDb.playlists.where("playlistKey").equals(LIKED_KEY).modify({ trackCount: total });
    }
    state = await patchState({ phase: "tracks" });
  }

  // ---- PHASE 3: playlist tracks with debug tracking for pending queues ----
  if (state.phase === "tracks") {
    const pending = (await vaultDb.playlists.where("platform").equals("spotify").toArray()).filter(
      (p) => p.playlistKey !== LIKED_KEY
    );

    console.log(">>> [Spotify Sync] Playlets pending track sync check:", pending.map(p => p.name));

    for (let i = 0; i < pending.length; i++) {
      if (signal?.aborted) return;
      const pl = pending[i];
      const id = pl.playlistKey.split(":")[1];
      let url = `https://api.spotify.com/v1/playlists/${id}/items?limit=100`;
      let restricted = false;

      onProgress?.({
        currentTrack: `Playlist ${i + 1} of ${pending.length}: ${pl.name}`,
        percent: 50 + Math.round((i / pending.length) * 50)
      });

      while (url) {
        if (signal?.aborted) return;
        const res = await spotifyFetch(url);
        
        if (res.status === 403 || res.status === 404) {
          console.log(`>>> [Auto-Cloner] 403/404 caught on "${pl.name}". Triggering auto-clone...`);
          const clonedSuccessfully = await autoCloneRestrictedPlaylist(id, pl.name);
          restricted = !clonedSuccessfully;
          break;
        }

        if (!res.ok) throw new Error(`Spotify playlist "${pl.name}" failed (${res.status})`);
        const data = await res.json();

        const tracks = (data.items || [])
          .map((it) => it?.track || it?.item)
          .filter((t) => t?.name)
          .map((t) => mapTrack(t));

        await saveTrackPage({
          platform: "spotify",
          playlistKey: pl.playlistKey,
          tracks,
          offset: data.offset || 0
        });
        url = data.next;
      }

      await vaultDb.playlists.update(pl.id, { syncedSnapshotId: pl.snapshotId, restricted });
    }
  }

  await patchState({ inProgress: false, phase: null, lastSyncAt: Date.now() });
  onProgress?.({ currentTrack: "Done", percent: 100 });
}

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

let authCallbackInFlight = null;

export const MusicApiService = {
  getConnectedTokens() {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      return stored ? JSON.parse(stored) : { spotify: false, tidal: false, appleMusic: false };
    } catch (e) {
      return { spotify: false, tidal: false, appleMusic: false };
    }
  },

  setPlatformConnection(platformKey, isConnected) {
    const tokens = this.getConnectedTokens();
    tokens[platformKey] = isConnected;
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  },

  handleAuthCallback() {
    if (!authCallbackInFlight) {
      authCallbackInFlight = this._exchangeCode().finally(() => {
        authCallbackInFlight = null;
      });
    }
    return authCallbackInFlight;
  },

  async _exchangeCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (!code) return false;

    const codeVerifier = localStorage.getItem("spotify_code_verifier");
    const clientId = CLIENT_IDS.spotify;
    const redirectUri = window.location.origin;

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier
        })
      });

      const data = await response.json();
      if (data.access_token) {
        storeTokens(data);
        this.setPlatformConnection("spotify", true);
        return true;
      }
    } catch (err) {
      console.error("Failed to exchange Spotify authorization code for token", err);
    } finally {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    return false;
  },

  async initiateAuth(platformKey) {
    if (platformKey === "spotify") {
      const clientId = CLIENT_IDS.spotify;
      const redirectUri = window.location.origin;
      const scopes =
        "user-library-read playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-read-private user-read-email";

      localStorage.removeItem(SPOTIFY_TOKEN_KEY);
      localStorage.removeItem(SPOTIFY_REFRESH_KEY);
      localStorage.removeItem(SPOTIFY_EXPIRES_KEY);

      const codeVerifier = generateRandomString(64);
      localStorage.setItem("spotify_code_verifier", codeVerifier);
      const hashed = await sha256(codeVerifier);
      const codeChallenge = base64encode(hashed);
      const authUrl = new URL("https://accounts.spotify.com/authorize");
      authUrl.searchParams.append("client_id", clientId);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("redirect_uri", redirectUri);
      authUrl.searchParams.append("code_challenge_method", "S256");
      authUrl.searchParams.append("code_challenge", codeChallenge);
      authUrl.searchParams.append("scope", scopes);
      authUrl.searchParams.append("show_dialog", "true");

      window.location.href = authUrl.toString();
    } else {
      this.setPlatformConnection(platformKey, true);
    }
  },

  async fetchUserPlaylists(platformKey) {
    if (platformKey !== "spotify") return [];
    const rows = await vaultDb.playlists.where("platform").equals("spotify").toArray();
    return rows
      .sort((a, b) => (b.isPinned || 0) - (a.isPinned || 0) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((pl) => ({
        id: pl.playlistKey,
        name: pl.name,
        count: pl.trackCount || 0,
        platforms: ["🟢"],
        curator: pl.curator,
        tracks: []
      }));
  },

  async fetchPlaylistTracks(playlistKey) {
    const links = await vaultDb.playlistTracks.where("playlistKey").equals(playlistKey).toArray();
    links.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const tracks = await vaultDb.tracks.where("trackKey").anyOf(links.map((l) => l.trackKey)).toArray();
    const byKey = new Map(tracks.map((t) => [t.trackKey, t]));
    return links
      .map((l) => byKey.get(l.trackKey))
      .filter(Boolean)
      .map((t) => ({ id: t.trackKey, title: t.title, artist: t.artist, album: t.album, status: "upcoming" }))
  }
};