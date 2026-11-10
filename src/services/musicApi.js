// src/services/musicApi.js

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

  // Initiate PKCE OAuth redirect flow with response_type=code
  async initiateAuth(platformKey) {
    if (platformKey === "spotify") {
      const clientId = CLIENT_IDS.spotify;
      const redirectUri = window.location.origin; // e.g. https://gapviz-react.pages.dev
      const scopes = "user-read-private user-read-email playlist-read-private";

      // Generate PKCE verifier and challenge
      const codeVerifier = generateRandomString(64);
      localStorage.setItem("spotify_code_verifier", codeVerifier);
      const hashed = await sha256(codeVerifier);
      const codeChallenge = base64encode(hashed);

      const authUrl = new URL("https://accounts.spotify.com/authorize");
      authUrl.searchParams.append("client_id", clientId);
      authUrl.searchParams.append("response_type", "code"); // Updated to code requirement
      authUrl.searchParams.append("redirect_uri", redirectUri);
      authUrl.searchParams.append("code_challenge_method", "S256");
      authUrl.searchParams.append("code_challenge", codeChallenge);
      authUrl.searchParams.append("scope", scopes);

      window.location.href = authUrl.toString();
    } else {
      this.setPlatformConnection(platformKey, true);
    }
  },

  // Fetch live playlists and tracks from Spotify API or fall back safely
  async fetchUserPlaylists(platformKey) {
    if (platformKey === "spotify") {
      const token = localStorage.getItem(SPOTIFY_TOKEN_KEY);
      if (token) {
        try {
          const response = await fetch("https://api.spotify.com/v1/me/playlists", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await response.json();
          
          if (data.items && data.items.length > 0) {
            const firstPlaylist = data.items[0];
            const tracksResponse = await fetch(firstPlaylist.tracks.href, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const tracksData = await tracksResponse.json();

            const formattedTracks = tracksData.items?.map((item, idx) => ({
              id: item.track?.id || idx,
              title: item.track?.name || "Unknown Track",
              artist: item.track?.artists?.map(a => a.name).join(", ") || "Unknown Artist",
              status: idx === 0 ? "current" : "upcoming"
            })) || [];

            return {
              name: firstPlaylist.name,
              platform: "Spotify",
              tracks: formattedTracks
            };
          }
        } catch (err) {
          console.error("Failed to fetch live Spotify playlists", err);
        }
      }

      // Fallback mock view if token isn't active yet
      return {
        name: "My Spotify Heavy Rotation",
        platform: "Spotify",
        tracks: [
          { id: 1, title: "Live Track Alpha", artist: "Spotify Artist One", status: "played" },
          { id: 2, title: "Live Track Beta", artist: "Spotify Artist Two", status: "current" },
          { id: 3, title: "Live Track Gamma", artist: "Spotify Artist Three", status: "upcoming" }
        ]
      };
    } else if (platformKey === "tidal") {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        name: "Tidal Master Quality Stream",
        platform: "Tidal",
        tracks: [
          { id: 101, title: "HiFi Mastercut 1", artist: "Tidal Audiophile", status: "current" },
          { id: 102, title: "HiFi Mastercut 2", artist: "Tidal Audiophile", status: "upcoming" }
        ]
      };
    }
    return null;
  }
};