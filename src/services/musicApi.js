// src/services/musicApi.js

const TOKEN_STORAGE_KEY = "gapviz_connected_services_tokens";

// Example OAuth Client IDs (replace with your production keys or environment variables)
const CLIENT_IDS = {
  spotify: process.env.REACT_APP_SPOTIFY_CLIENT_ID || "mock_spotify_client_id",
  tidal: process.env.REACT_APP_TIDAL_CLIENT_ID || "mock_tidal_client_id"
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

  // Initiate real OAuth redirect flow if credentials are live
  initiateAuth(platformKey) {
    if (platformKey === "spotify") {
      const clientId = CLIENT_IDS.spotify;
      const redirectUri = window.location.origin + "/callback";
      const scopes = "user-read-private user-read-email playlist-read-private";
      
      if (clientId === "mock_spotify_client_id") {
        // Fallback simulation toggle if keys aren't set yet
        this.setPlatformConnection("spotify", true);
        return true;
      }

      // Real Spotify OAuth redirect link
      window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    } else {
      // Toggle state directly for simulated services
      this.setPlatformConnection(platformKey, true);
    }
  },

  async fetchUserPlaylists(platformKey) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (platformKey === "spotify") {
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