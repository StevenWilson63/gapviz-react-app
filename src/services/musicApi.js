// src/services/musicApi.js

const TOKEN_STORAGE_KEY = "gapviz_connected_services_tokens";
const SPOTIFY_TOKEN_KEY = "gapviz_spotify_access_token";

const CLIENT_IDS = {
  spotify: "c75bf5ba6c1b4d1c897ca910d171bd5c",
  tidal: "mock_tidal_client_id"
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

  // Captures token from URL hash after Spotify redirects back
  handleAuthCallback() {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const token = hash.split("&").find(item => item.startsWith("#access_token"))?.split("=")[1];
      if (token) {
        localStorage.setItem(SPOTIFY_TOKEN_KEY, token);
        this.setPlatformConnection("spotify", true);
        window.location.hash = ""; // Clean URL hash
        return true;
      }
    }
    return false;
  },

  // Initiate real OAuth redirect flow
  initiateAuth(platformKey) {
    if (platformKey === "spotify") {
      const clientId = CLIENT_IDS.spotify;
      const redirectUri = window.location.origin; // Uses https://gapviz-react.pages.dev
      const scopes = "user-read-private user-read-email playlist-read-private";

      window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
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