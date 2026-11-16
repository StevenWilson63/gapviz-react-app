// src/services/musicApi.js

import { runChunkedVaultSync } from "./syncEngine";
import { vaultDb } from "./vaultDb";

const TOKEN_STORAGE_KEY = "gapviz_connected_services_tokens";
const SPOTIFY_TOKEN_KEY = "gapviz_spotify_access_token";

const CLIENT_IDS = {
  spotify: "c75bf5ba6c1b4d1c897ca910d171bd5c",
  tidal: "mock_tidal_client_id"
};

const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, retries = 2, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        console.warn(`>>> [Spotify API] Rate limited (429) on ${url}. Retrying in ${delay / 1000}s...`);
        await sleep(delay);
        delay *= 2;
        continue;
      }
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(delay);
    }
  }
  throw new Error(`Max retries reached for ${url}`);
}

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

  async handleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
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
            code_verifier: codeVerifier,
          }),
        });

        const data = await response.json();
        if (data.access_token) {
          localStorage.setItem(SPOTIFY_TOKEN_KEY, data.access_token);
          this.setPlatformConnection("spotify", true);
          window.history.replaceState({}, document.title, window.location.pathname);
          return true;
        }
      } catch (err) {
        console.error("Failed to exchange Spotify authorization code for token", err);
      }
    }
    return false;
  },

  async initiateAuth(platformKey) {
    if (platformKey === "spotify") {
      const clientId = CLIENT_IDS.spotify;
      const redirectUri = window.location.origin;
      const scopes = "user-library-read playlist-read-private playlist-read-collaborative user-read-private user-read-email";

      localStorage.removeItem(SPOTIFY_TOKEN_KEY);

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

  async fetchUserPlaylists(platformKey, onProgress) {
    if (platformKey === "spotify") {
      const token = localStorage.getItem(SPOTIFY_TOKEN_KEY);
      if (!token) return [];

      // 1. Always check cache first to prevent 429 blocks
      const cached = localStorage.getItem("gapviz_spotify_playlists_cache");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            console.log(">>> [Spotify API] 429 Protection: Returning playlists from local cache.");
            return parsed;
          }
        } catch (e) {}
      }

      try {
        onProgress?.({ currentTrack: "Connecting to Spotify vault...", percent: 15 });
        
        const response = await fetchWithRetry("https://api.spotify.com/v1/me/playlists?limit=50", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // If 429 persists even after retries, fallback gracefully to local IndexedDB vault tracks
        if (!response.ok) {
          console.warn(">>> [Spotify API] Rate limit hit. Falling back to local vault tracks...");
          const localVaultTracks = await vaultDb.tracks.toArray();
          
          const fallbackPlaylists = [
            {
              id: "fallback_vault_playlist",
              name: "Master Vault Library",
              count: localVaultTracks.length || 0,
              platforms: ["🟢"],
              curator: "Local IndexedDB Vault",
              tracks: localVaultTracks.map((t, idx) => ({
                id: t.trackKey || idx,
                title: t.title,
                artist: t.artist,
                album: t.album || "Vault",
                status: idx === 0 ? "current" : "upcoming"
              }))
            }
          ];
          return fallbackPlaylists;
        }

        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const mappedPlaylists = [];
          const totalPl = data.items.length;

          for (const [index, pl] of data.items.entries()) {
            onProgress?.({ 
              currentTrack: `Syncing: ${pl.name}`, 
              percent: Math.round(30 + (index / totalPl) * 60) 
            });

            mappedPlaylists.push({
              id: pl.id || index,
              name: pl.name,
              count: pl.tracks?.total || 0,
              platforms: ["🟢"],
              curator: pl.owner?.display_name || "Spotify User",
              tracks: []
            });
          }

          localStorage.setItem("gapviz_spotify_playlists_cache", JSON.stringify(mappedPlaylists));
          return mappedPlaylists;
        }
      } catch (err) {
        console.warn(">>> [Spotify API] Network or rate limit error, loading local vault fallback.", err);
        
        // Ultimate fallback to prevent blank screen on 429
        try {
          const localVaultTracks = await vaultDb.tracks.toArray();
          return [{
            id: "emergency_fallback",
            name: "Master Vault (Offline Mode)",
            count: localVaultTracks.length,
            platforms: ["🟢"],
            curator: "Local Vault",
            tracks: localVaultTracks.map((t, idx) => ({
              id: t.trackKey || idx,
              title: t.title,
              artist: t.artist,
              album: t.album || "Vault",
              status: idx === 0 ? "current" : "upcoming"
            }))
          }];
        } catch (dbErr) {
          return [];
        }
      }
    }
    return [];
  }
};