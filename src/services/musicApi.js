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

async function fetchWithRetry(url, options, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        console.warn(`>>> [Spotify API] Rate limited (429) on ${url}. Backing off for ${delay / 1000}s...`);
        await sleep(delay);
        delay *= 2; // Exponential backoff
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

  // Fetch full user playlists with pagination and rate-limit safety
  async fetchUserPlaylists(platformKey, onProgress) {
    if (platformKey === "spotify") {
      const token = localStorage.getItem(SPOTIFY_TOKEN_KEY);
      if (!token) return [];

      try {
        onProgress?.({ currentTrack: "Connecting to Spotify user profile...", percent: 10 });
        
        let currentUserId = "";
        let userName = "Spotify User";
        const uRes = await fetchWithRetry("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (uRes.ok) {
          const uData = await uRes.json();
          currentUserId = uData.id || "";
          userName = uData.display_name || userName;
        }

        onProgress?.({ currentTrack: "Fetching playlist library containers...", percent: 30 });
        
        let allPlaylists = [];
        let playlistUrl = "https://api.spotify.com/v1/me/playlists?limit=50";
        
        while (playlistUrl) {
          const plRes = await fetchWithRetry(playlistUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!plRes.ok) break;

          const plData = await plRes.json();
          const batch = (plData.items || []).map((pl, idx) => ({
            id: pl.id || idx,
            name: pl.name,
            count: pl.tracks?.total || 0,
            platforms: ["🟢"],
            curator: pl.owner?.display_name || userName,
            ownerId: pl.owner?.id,
            tracks: [] // Lazy-loaded on click to avoid 429 errors
          }));

          allPlaylists.push(...batch);
          playlistUrl = plData.next; // Handles pagination for large library accounts (>50 playlists)
          if (playlistUrl) await sleep(200);
        }

        onProgress?.({ currentTrack: "Syncing Saved Library (Liked Songs)...", percent: 70 });
        let savedTracks = [];
        let savedUrl = "https://api.spotify.com/v1/me/tracks?limit=50";
        let loopGuard = 0;

        while (savedUrl && loopGuard < 20) {
          const savedRes = await fetchWithRetry(savedUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!savedRes.ok) break;

          const savedData = await savedRes.json();
          const trackBatch = (savedData.items || []).map((item, idx) => {
            const tr = item.track;
            if (!tr || !tr.name) return null;
            return {
              id: tr.id || idx,
              title: tr.name,
              artist: tr.artists?.map(a => a.name).join(", ") || "Unknown Artist",
              album: tr.album?.name || "Single",
              status: "upcoming"
            };
          }).filter(Boolean);

          savedTracks.push(...trackBatch);
          savedUrl = savedData.next;
          loopGuard++;
          await sleep(150);
        }

        if (savedTracks.length > 0) {
          allPlaylists.unshift({
            id: "spotify_liked_songs_vault",
            name: `${userName}'s Liked Songs`,
            count: savedTracks.length,
            platforms: ["🟢"],
            curator: "Spotify Saved Library",
            tracks: savedTracks
          });
        }

        localStorage.setItem("gapviz_spotify_playlists_cache", JSON.stringify(allPlaylists));
        return allPlaylists;

      } catch (err) {
        console.error(">>> [Spotify API] Error fetching playlists with pagination:", err);
        
        // Fallback to local cache if offline or rate-limited
        const cached = localStorage.getItem("gapviz_spotify_playlists_cache");
        if (cached) {
          try { return JSON.parse(cached); } catch (e) {}
        }
      }
    }
    return [];
  },

  // Lazy-load tracks for a specific playlist when clicked by the user
  async fetchPlaylistTracks(playlistId) {
    if (playlistId === "spotify_liked_songs_vault" || playlistId.startsWith("fallback")) return [];
    
    const token = localStorage.getItem(SPOTIFY_TOKEN_KEY);
    if (!token) return [];

    try {
      let tracksList = [];
      let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=100`;
      
      while (nextUrl) {
        const trRes = await fetchWithRetry(nextUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!trRes.ok) {
          // Fallback container check for restricted third-party playlists
          const fallbackRes = await fetchWithRetry(`https://api.spotify.com/v1/playlists/${playlistId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (fallbackData.tracks && fallbackData.tracks.items) {
              tracksList = fallbackData.tracks.items.map((item, idx) => {
                const trackObj = item.track || item;
                if (!trackObj || !trackObj.name) return null;
                return {
                  id: trackObj.id || idx,
                  title: trackObj.name,
                  artist: trackObj.artists?.map(a => a.name).join(", ") || "Unknown Artist",
                  album: trackObj.album?.name || "Single",
                  status: idx === 0 ? "current" : "upcoming"
                };
              }).filter(Boolean);
            }
          }
          break;
        }

        const trData = await trRes.json();
        const batch = (trData.items || []).map((item, idx) => {
          const trackObj = item.track || item.item || item;
          if (!trackObj || !trackObj.name) return null;

          return {
            id: trackObj.id || idx,
            title: trackObj.name,
            artist: trackObj.artists?.map(a => a.name).join(", ") || trackObj.artist || "Unknown Artist",
            album: trackObj.album?.name || "Single",
            status: idx === 0 ? "current" : "upcoming"
          };
        }).filter(Boolean);

        tracksList.push(...batch);
        nextUrl = trData.next;
        if (nextUrl) await sleep(150);
      }

      return tracksList;
    } catch (e) {
      console.warn(`Could not load tracks for playlist ID ${playlistId}`, e);
      return [];
    }
  }
};