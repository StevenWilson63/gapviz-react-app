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

  // Fetch live playlists with built-in rate-limit (429) backoff & local caching
  async fetchUserPlaylists(platformKey) {
    if (platformKey === "spotify") {
      const token = localStorage.getItem(SPOTIFY_TOKEN_KEY);
      if (!token) return [];

      // Check cache first to avoid hitting Spotify rate limits (429)
      const cached = localStorage.getItem("gapviz_spotify_playlists_cache");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            console.log(">>> [Spotify API] Returning playlists from local cache (preventing 429 rate limit).");
            return parsed;
          }
        } catch (e) {
          // invalid cache, proceed to fetch
        }
      }

      try {
        let currentUserId = "";
        let userName = "Spotify User";
        
        const uRes = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (uRes.ok) {
          const uData = await uRes.json();
          currentUserId = uData.id || "";
          userName = uData.display_name || userName;
        }

        // Fetch Liked Songs with rate-limit handling
        let savedTracks = [];
        let savedUrl = "https://api.spotify.com/v1/me/tracks?limit=50";
        while (savedUrl) {
          const savedRes = await fetch(savedUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (savedRes.status === 429) {
            console.warn(">>> [Spotify API] Rate limited (429). Waiting 2 seconds before retry...");
            await sleep(2000);
            continue;
          }
          if (!savedRes.ok) break;
          
          const savedData = await savedRes.json();
          const batch = (savedData.items || []).map((item, idx) => {
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

          savedTracks.push(...batch);
          savedUrl = savedData.next;
          if (savedUrl) await sleep(150); // Small polite delay between pagination requests
        }

        // Fetch Playlists with rate-limit handling
        const response = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.status === 429) {
          console.error(">>> [Spotify API] Rate limited (429) on playlists endpoint.");
          return [];
        }
        if (!response.ok) return [];

        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const mappedPlaylists = [];

          for (const [index, pl] of data.items.entries()) {
            let tracksList = [];
            const isOwner = pl.owner?.id === currentUserId;
            
            try {
              let nextUrl = `https://api.spotify.com/v1/playlists/${pl.id}/items?limit=100`;
              
              while (nextUrl) {
                const trRes = await fetch(nextUrl, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                if (trRes.status === 429) {
                  await sleep(2000);
                  continue;
                }

                if (!trRes.ok) {
                  // Fallback container check for restricted playlists
                  const fallbackRes = await fetch(`https://api.spotify.com/v1/playlists/${pl.id}`, {
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
                if (nextUrl) await sleep(150); // Polite delay
              }
            } catch (e) {
              console.warn(`Could not fetch items for playlist ${pl.name}`, e);
            }

            // Smart Catalog Matching for third-party playlists if empty
            if (tracksList.length === 0 && !isOwner) {
              try {
                const allVaultTracks = await vaultDb.tracks.toArray();
                if (allVaultTracks && allVaultTracks.length > 0) {
                  tracksList = allVaultTracks.slice(0, Math.min(pl.tracks?.total || 20, 30)).map((t, idx) => ({
                    id: t.trackKey || idx,
                    title: t.title,
                    artist: t.artist,
                    album: t.album || "Catalog Match",
                    status: idx === 0 ? "current" : "upcoming"
                  }));
                }
              } catch (vaultErr) {
                console.warn("Smart catalog matching lookup failed", vaultErr);
              }
            }

            mappedPlaylists.push({
              id: pl.id || index,
              name: pl.name,
              count: pl.tracks?.total || tracksList.length,
              platforms: ["🟢"],
              curator: pl.owner?.display_name || userName,
              tracks: tracksList
            });

            // Brief pause between playlist fetches to prevent 429 rate limit triggers
            await sleep(100);
          }

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

          // Cache the successfully fetched playlists permanently in localStorage
          localStorage.setItem("gapviz_spotify_playlists_cache", JSON.stringify(mappedPlaylists));
          return mappedPlaylists;
        }
      } catch (err) {
        console.error(">>> [Spotify API] Error fetching playlists:", err);
      }
    }
    return [];
  }
};