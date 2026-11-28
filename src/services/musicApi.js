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

// A playlist Gapviz could not read is checked again after this long (or when the user asks)
const RETRY_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

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
// Token handling (access token + refresh so long syncs survive the 1 hour expiry)
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

export async function getSpotifyAccessToken() {
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

  let token = await getSpotifyAccessToken();
  lastRequestAt = Date.now();
  let res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401) {
    token = await refreshAccessToken();
    lastRequestAt = Date.now();
    res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
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
// On-demand Artwork Resolver (no IndexedDB bulk caching needed)
// ---------------------------------------------------------------------------

const sessionArtworkCache = new Map();

export async function fetchSpotifyTrackArtwork(uri) {
  if (!uri || !String(uri).startsWith("spotify:track:")) return "";
  if (sessionArtworkCache.has(uri)) return sessionArtworkCache.get(uri);

  const trackId = uri.split(":")[2];
  if (!trackId) return "";

  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/track/${trackId}`)}`;
    const oembedRes = await fetch(oembedUrl);
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      if (data.thumbnail_url) {
        sessionArtworkCache.set(uri, data.thumbnail_url);
        return data.thumbnail_url;
      }
    }
  } catch (err) {
    // Fall through to Web API lookup
  }

  try {
    const res = await spotifyFetch(`https://api.spotify.com/v1/tracks/${encodeURIComponent(trackId)}`);
    if (res.ok) {
      const tr = await res.json();
      const art = tr?.album?.images?.[0]?.url || "";
      if (art) sessionArtworkCache.set(uri, art);
      return art;
    }
  } catch (err) {
    console.warn(">>> [Artwork] Lookup skipped:", err?.message || err);
  }

  return "";
}

// ---------------------------------------------------------------------------
// Spotify Web Playback SDK & Playback Controls (Phase 4A)
// ---------------------------------------------------------------------------

let sdkScriptPromise = null;

export function loadSpotifyPlaybackSdk() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Web Playback SDK requires a browser environment."));
  }
  if (window.Spotify?.Player) {
    return Promise.resolve(window.Spotify);
  }
  if (sdkScriptPromise) {
    return sdkScriptPromise;
  }

  sdkScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById("spotify-web-playback-sdk");
    const previousReady = window.onSpotifyWebPlaybackSDKReady;

    window.onSpotifyWebPlaybackSDKReady = () => {
      if (typeof previousReady === "function") {
        previousReady();
      }
      if (window.Spotify?.Player) {
        resolve(window.Spotify);
      } else {
        reject(new Error("Spotify SDK loaded without Player constructor."));
      }
    };

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "spotify-web-playback-sdk";
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      script.onerror = () => {
        sdkScriptPromise = null;
        reject(new Error("Failed to load Spotify Web Playback SDK script."));
      };
      document.body.appendChild(script);
    }
  });

  return sdkScriptPromise;
}

export async function createSpotifySdkPlayer({ name = "Gapviz Web Player", volume = 0.75 } = {}) {
  const SpotifySdk = await loadSpotifyPlaybackSdk();
  return new SpotifySdk.Player({
    name,
    volume,
    getOAuthToken: async (cb) => {
      try {
        const token = await getSpotifyAccessToken();
        cb(token);
      } catch (err) {
        console.error(">>> [Spotify SDK] Token retrieval failed:", err);
      }
    }
  });
}

export async function transferSpotifyPlayback(deviceId, play = false) {
  if (!deviceId) return false;
  const res = await spotifyFetch("https://api.spotify.com/v1/me/player", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device_ids: [deviceId],
      play
    })
  });
  return res.ok || res.status === 204;
}

export async function playSpotifyUri({ uri, uris, deviceId, positionMs = 0 }) {
  const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : "";
  const body = {};
  if (Array.isArray(uris) && uris.length > 0) {
    body.uris = uris;
  } else if (uri) {
    body.uris = [uri];
  }
  if (positionMs > 0) {
    body.position_ms = positionMs;
  }

  const res = await spotifyFetch(`https://api.spotify.com/v1/me/player/play${query}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok && res.status !== 204) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Spotify play failed (${res.status}): ${errText}`);
  }
  return true;
}

export async function pauseSpotifyPlayback(deviceId) {
  const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : "";
  const res = await spotifyFetch(`https://api.spotify.com/v1/me/player/pause${query}`, {
    method: "PUT"
  });
  return res.ok || res.status === 204;
}

export async function resumeSpotifyPlayback(deviceId) {
  const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : "";
  const res = await spotifyFetch(`https://api.spotify.com/v1/me/player/play${query}`, {
    method: "PUT"
  });
  return res.ok || res.status === 204;
}

export async function nextSpotifyTrack(deviceId) {
  const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : "";
  const res = await spotifyFetch(`https://api.spotify.com/v1/me/player/next${query}`, {
    method: "POST"
  });
  return res.ok || res.status === 204;
}

export async function previousSpotifyTrack(deviceId) {
  const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : "";
  const res = await spotifyFetch(`https://api.spotify.com/v1/me/player/previous${query}`, {
    method: "POST"
  });
  return res.ok || res.status === 204;
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
// Resumable sync (checkpointed in IndexedDB)
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
    inProgress: !!state.inProgress,
    hiddenPlaylists: state.lastHiddenPlaylists || 0
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

async function savePagingChain({ playlistKey, firstPaging, signal }) {
  let paging = firstPaging;
  let count = 0;

  while (paging) {
    if (signal?.aborted) return { aborted: true, count };

    const tracks = (paging.items || [])
      .map((it) => it?.track || it?.item)
      .filter((t) => t?.name)
      .map((t) => mapTrack(t));

    await saveTrackPage({
      platform: "spotify",
      playlistKey,
      tracks,
      offset: paging.offset || 0
    });
    count += tracks.length;

    if (!paging.next) break;
    const res = await spotifyFetch(paging.next);
    if (res.status === 403 || res.status === 404) break;
    if (!res.ok) throw new Error(`Spotify playlist page failed (${res.status})`);
    paging = await res.json();
  }

  return { aborted: false, count };
}

async function importPlaylistTracks(pl, signal) {
  const id = pl.playlistKey.split(":")[1];
  const diag = {
    name: pl.name,
    owner: pl.spotifyOwned ? "spotify" : "other",
    itemsStatus: null,
    objectStatus: null,
    imported: 0
  };

  const itemsRes = await spotifyFetch(`https://api.spotify.com/v1/playlists/${id}/items?limit=100`);
  diag.itemsStatus = itemsRes.status;
  if (itemsRes.ok) {
    const first = await itemsRes.json();
    const out = await savePagingChain({ playlistKey: pl.playlistKey, firstPaging: first, signal });
    diag.imported = out.count;
    return { ok: true, aborted: out.aborted, count: out.count, diag };
  }

  if (signal?.aborted) return { ok: false, aborted: true, count: 0, diag };
  const objRes = await spotifyFetch(`https://api.spotify.com/v1/playlists/${id}`);
  diag.objectStatus = objRes.status;
  if (objRes.ok) {
    const obj = await objRes.json();
    const paging = obj.items?.items ? obj.items : obj.tracks?.items ? obj.tracks : null;
    if (paging) {
      const out = await savePagingChain({ playlistKey: pl.playlistKey, firstPaging: paging, signal });
      diag.imported = out.count;
      return { ok: true, aborted: out.aborted, count: out.count, diag };
    }
  }

  return { ok: false, aborted: false, count: 0, diag };
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
      hiddenPlaylists: 0,
      incremental: !!state.lastSyncAt
    });
  }

  if (state.phase === "playlists") {
    let url = state.playlistsNext || "https://api.spotify.com/v1/me/playlists?limit=50";
    let hiddenTotal = state.hiddenPlaylists || 0;

    while (url) {
      if (signal?.aborted) return;
      const res = await spotifyFetch(url);
      if (!res.ok) throw new Error(`Spotify playlist list failed (${res.status})`);
      const data = await res.json();

      const rawItems = data.items || [];
      const items = rawItems.filter(Boolean);
      hiddenTotal += rawItems.length - items.length;

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
          spotifyOwned: pl.owner?.id === "spotify",
          syncedSnapshotId: prev?.syncedSnapshotId || null,
          restricted: prev?.restricted || false,
          restrictedAt: prev?.restrictedAt || 0,
          imageUrl: pl.images?.[0]?.url || prev?.imageUrl || "",
          sortOrder: (data.offset || 0) + i + 1,
          isPinned: prev?.isPinned || 0,
          isArchived: prev?.isArchived || 0
        };
        if (prev) row.id = prev.id;
        return row;
      });
      await vaultDb.playlists.bulkPut(rows);

      url = data.next;
      await patchState({ playlistsNext: url, hiddenPlaylists: hiddenTotal });
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
      restricted: false,
      sortOrder: 0,
      isPinned: 1,
      isArchived: likedPrev?.isArchived || 0
    };
    if (likedPrev) likedRow.id = likedPrev.id;
    await vaultDb.playlists.put(likedRow);

    state = await patchState({ phase: "liked" });
  }

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

  if (state.phase === "tracks") {
    const needsImport = (p) => {
      if (p.playlistKey === LIKED_KEY) return false;
      if (p.restricted) return Date.now() - (p.restrictedAt || 0) > RETRY_AFTER_MS;
      return p.snapshotId !== p.syncedSnapshotId;
    };

    const pending = (await vaultDb.playlists.where("platform").equals("spotify").toArray()).filter(needsImport);
    const diagnostics = [];

    for (let i = 0; i < pending.length; i++) {
      if (signal?.aborted) return;
      const pl = pending[i];

      onProgress?.({
        currentTrack: `Playlist ${i + 1} of ${pending.length}: ${pl.name}`,
        percent: 50 + Math.round((i / pending.length) * 50)
      });

      const result = await importPlaylistTracks(pl, signal);
      if (result.aborted) return;

      diagnostics.push(result.diag);

      if (result.ok) {
        await vaultDb.playlists.update(pl.id, {
          syncedSnapshotId: pl.snapshotId,
          restricted: false,
          restrictedAt: 0
        });
      } else {
        await vaultDb.playlists.update(pl.id, { restricted: true, restrictedAt: Date.now() });
      }
    }

    const failed = diagnostics.filter((d) => !d.imported && d.itemsStatus && d.itemsStatus !== 200);
    if (failed.length > 0) {
      console.info(">>> [Gapviz sync] Playlists Spotify would not let us read:");
      console.table(failed);
    }
  }

  const finalState = await getState();
  await patchState({
    inProgress: false,
    phase: null,
    lastSyncAt: Date.now(),
    lastHiddenPlaylists: finalState.hiddenPlaylists || 0
  });
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("gapviz:spotify-connection-changed"));
    }
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
      console.error("Spotify token exchange was refused:", data);
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
      const scopes = [
        "user-library-read",
        "playlist-read-private",
        "playlist-read-collaborative",
        "user-read-private",
        "user-read-email",
        "streaming",
        "user-read-playback-state",
        "user-modify-playback-state"
      ].join(" ");

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
      .filter((pl) => !pl.isArchived)
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
      .map((t) => ({
        id: t.trackKey,
        trackKey: t.trackKey,
        title: t.title,
        artist: t.artist,
        album: t.album,
        artworkUrl: t.artworkUrl || "",
        durationMs: t.durationMs || 0,
        uri: t.uri || ""
      }));
  }
};