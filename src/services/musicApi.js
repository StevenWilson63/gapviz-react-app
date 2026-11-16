// src/services/musicApi.js

import { runChunkedVaultSync } from "./syncEngine";

const TOKEN_STORAGE_KEY = "gapviz_connected_services_tokens";
const SPOTIFY_TOKEN_KEY = "gapviz_spotify_access_token";

const CLIENT_IDS = {
  spotify: "c75bf5ba6c1b4d1c897ca910d171bd5c",
  tidal: "mock_tidal_client_id"
};

// Helper to generate random string for PKCE verifier
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

// Helper to hash code verifier for PKCE code_challenge (S256)
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

  // Handles callback code exchange after Spotify redirects back
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
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
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
          
          console.log(">>> [Spotify OAuth] Token acquired successfully! Fetching tracks for vault sync...");
          
          // Automatically fetch user playlists/tracks and run the chunked sync engine
          try {
            const fetchedPlaylists = await this.fetchUserPlaylists("spotify");
            const allTracks = [];
            fetchedPlaylists.forEach(pl => {
              if (pl.tracks && Array.isArray(pl.tracks)) {
                pl.tracks.forEach(tr => {
                  allTracks.push({
                    id: tr.id,
                    title: tr.title,
                    artist: tr.artist,
                    album: tr.album || "Single",
                    playlistId: pl.id
                  });
                });
              }
            });

            if (allTracks.length > 0) {
              console.log(`>>> [Vault Sync] Ingesting ${allTracks.length} tracks into local IndexedDB...`);
              await runChunkedVaultSync({
                platform: "spotify",
                rawTracks: allTracks,
                onProgress: (p) => console.log(`Sync progress: ${p.percent}%`)
              });
              console.log(">>> [Vault Sync] Background ingestion completed successfully.");
            }
          } catch (syncErr) {
            console.error(">>> [Vault Sync] Error running background sync after auth:", syncErr);
          }

          // Clear query params from browser URL cleanly
          window.history.replaceState({}, document.title, window.location.pathname);
          return true;
        } else {
          console.error("Spotify token exchange failed data:", data);
        }
      } catch (err) {
        console.error("Failed to exchange Spotify authorization code for token", err);
      }
    }
    return false;
  },

  // Initiate PKCE OAuth redirect flow with comprehensive scopes & dialog prompt
  async initiateAuth(platformKey) {
    if (platformKey === "spotify") {
      const clientId = CLIENT_IDS.spotify;
      const redirectUri = window.location.origin;
      const scopes = "user-library-read playlist-read-private playlist-read-collaborative user-read-private user-read-email";

      // Clear old token to force fresh permission grant
      localStorage.removeItem(SPOTIFY_TOKEN_KEY);

      // Generate PKCE verifier and challenge
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
      authUrl.searchParams.append("show_dialog", "true"); // Forces consent screen to grant playlist scopes

      window.location.href = authUrl.toString();
    } else {
      this.setPlatformConnection(platformKey, true);
    }
  },

  // Fetch live playlists and tracks safely
  async fetchUserPlaylists(platformKey) {
    if (platformKey === "spotify") {
      const token = localStorage.getItem(SPOTIFY_TOKEN_KEY);
      if (!token) return [];

      try {
        let userName = "Spotify User";
        try {
          const uRes = await fetch("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (uRes.ok) {
            const uData = await uRes.json();
            userName = uData.display_name || userName;
          }
        } catch (e) {
          console.warn("Could not fetch user profile", e);
        }

        let savedTracks = [];
        try {
          const savedRes = await fetch("https://api.spotify.com/v1/me/tracks?limit=50", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (savedRes.ok) {
            const savedData = await savedRes.json();
            savedTracks = savedData.items?.map((item, idx) => ({
              id: item.track?.id || idx,
              title: item.track?.name || "Unknown Track",
              artist: item.track?.artists?.map(a => a.name).join(", ") || "Unknown Artist",
              album: item.track?.album?.name || "Single",
              status: idx === 0 ? "current" : "upcoming"
            })).filter(t => t.title !== "Unknown Track") || [];
          }
        } catch (e) {
            console.warn("Could not fetch user saved tracks", e);
        }

        const response = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          console.error(">>> [Spotify API] Playlists fetch failed with status:", response.status);
          return [];
        }

        const data = await response.json();
        console.log(">>> [Spotify API] Fetched playlists list:", data.items);

        if (data.items && data.items.length > 0) {
          const mappedPlaylists = await Promise.all(data.items.map(async (pl, index) => {
            let tracksList = [];
            
            try {
              const tracksUrl = `https://api.spotify.com/v1/playlists/${pl.id}/tracks?limit=100`;
              console.log(`>>> [Spotify API] Fetching tracks for playlist [${pl.name}]: ${tracksUrl}`);
              
              const trRes = await fetch(tracksUrl, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (trRes.ok) {
                const trData = await trRes.json();
                console.log(`>>> [Spotify API] Response for [${pl.name}]:`, trData);
                
                tracksList = trData.items?.map((item, idx) => {
                  const trackObj = item.track;
                  if (!trackObj) return null;
                  return {
                    id: trackObj.id || idx,
                    title: trackObj.name || "Unknown Track",
                    artist: trackObj.artists?.map(a => a.name).join(", ") || "Unknown Artist",
                    album: trackObj.album?.name || "Single",
                    status: idx === 0 ? "current" : "upcoming"
                  };
                }).filter(Boolean) || [];
              } else {
                console.warn(`>>> [Spotify API] Failed tracks fetch for [${pl.name}]. Status: ${trRes.status}`);
              }
            } catch (e) {
              console.warn(`Could not fetch tracks for playlist ${pl.name}`, e);
            }

            return {
              id: pl.id || index,
              name: pl.name,
              count: pl.tracks?.total || tracksList.length,
              platforms: ["🟢"],
              curator: pl.owner?.display_name || userName,
              tracks: tracksList
            };
          }));

          if (savedTracks.length > 0) {
            mappedPlaylists.unshift({
              id: "spotify_liked_songs_vault",
              name: `${userName}'s Liked Songs`,
              count: savedTracks.length,
              platforms: ["🟢"],
              curator: "Spotify Saved Library",
              tracks: savedTracks
            });
          }

          return mappedPlaylists;
        }
      } catch (err) {
        console.error(">>> [Spotify API] Error fetching playlists:", err);
      }
    }
    return [];
  }
};