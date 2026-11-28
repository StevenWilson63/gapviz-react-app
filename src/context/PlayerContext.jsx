// src/context/PlayerContext.jsx

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import {
  MusicApiService,
  createSpotifySdkPlayer,
  transferSpotifyPlayback,
  playSpotifyUri,
  pauseSpotifyPlayback,
  resumeSpotifyPlayback,
  nextSpotifyTrack,
  previousSpotifyTrack,
  fetchSpotifyTrackArtwork
} from "../services/musicApi";

const DEFAULT_TRACK = {
  id: "default-dreams",
  trackKey: "default-dreams",
  title: "Dreams",
  artist: "Fleetwood Mac",
  album: "Rumours (1977)",
  duration: "4:17",
  artworkUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
  uri: null
};

const DEFAULT_QUEUE_META = {
  name: "Massive Guitar Solos",
  platforms: [
    { name: "Spotify", icon: "🟢" },
    { name: "Tidal", icon: "🟦" },
    { name: "Apple Music", icon: "🍎" }
  ],
  tracks: [
    { id: 1, title: "Go Your Own Way", artist: "Fleetwood Mac", album: "Rumours (1977)", status: "played" },
    { id: 2, title: "The Chain", artist: "Fleetwood Mac", album: "Rumours (1977)", status: "played" },
    { id: 3, title: "Dreams", artist: "Fleetwood Mac", album: "Rumours (1977)", status: "current" },
    { id: 4, title: "Hotel California", artist: "Eagles", album: "Hotel California", status: "upcoming" },
    { id: 5, title: "Sultans of Swing", artist: "Dire Straits", album: "Dire Straits", status: "upcoming" },
    { id: 6, title: "Comfortably Numb", artist: "Pink Floyd", album: "The Wall", status: "upcoming" }
  ]
};

const resolveSpotifyUri = (track) => {
  if (track?.uri && String(track.uri).startsWith("spotify:")) {
    return track.uri;
  }
  const rawKey = String(track?.trackKey || track?.id || "");
  if (rawKey.startsWith("spotify:track:")) {
    return rawKey;
  }
  if (rawKey.startsWith("spotify:")) {
    const parts = rawKey.split(":");
    if (parts[1] && parts[2]) return `spotify:${parts[1]}:${parts[2]}`;
    if (parts[1]) return `spotify:track:${parts[1]}`;
  }
  return null;
};

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(DEFAULT_TRACK);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queueMeta, setQueueMeta] = useState(DEFAULT_QUEUE_META);
  const [queueIndex, setQueueIndex] = useState(2);
  const [lastPlaybackRoute, setLastPlaybackRoute] = useState(null);
  const [spotifyDeviceId, setSpotifyDeviceId] = useState(null);
  const [spotifyPlayerReady, setSpotifyPlayerReady] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);
  const [connectionEpoch, setConnectionEpoch] = useState(0);

  const sdkPlayerRef = useRef(null);
  const deviceIdRef = useRef(null);
  const currentTrackRef = useRef(currentTrack);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const onConnectionChange = () => setConnectionEpoch((prev) => prev + 1);
    window.addEventListener("gapviz:spotify-connection-changed", onConnectionChange);
    return () => window.removeEventListener("gapviz:spotify-connection-changed", onConnectionChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isSpotifyConnected = MusicApiService.getConnectedTokens()?.spotify;

    if (!isSpotifyConnected) {
      setSpotifyPlayerReady(false);
      return undefined;
    }

    (async () => {
      try {
        console.log(">>> [Spotify SDK] Initializing Gapviz Web Player...");
        const player = await createSpotifySdkPlayer({ name: "Gapviz Web Player", volume: 0.8 });
        if (cancelled) {
          player.disconnect();
          return;
        }

        sdkPlayerRef.current = player;

        player.addListener("ready", async ({ device_id }) => {
          if (cancelled) return;
          console.log(">>> [Spotify SDK] Ready with Device ID:", device_id);
          deviceIdRef.current = device_id;
          setSpotifyDeviceId(device_id);
          setSpotifyPlayerReady(true);
          setPlaybackError(null);
          try {
            await transferSpotifyPlayback(device_id, false);
          } catch (e) {
            // Safe to ignore until user initiates playback
          }
        });

        player.addListener("not_ready", ({ device_id }) => {
          if (cancelled) return;
          console.warn(">>> [Spotify SDK] Device went offline:", device_id);
          setSpotifyPlayerReady(false);
        });

        player.addListener("player_state_changed", (state) => {
          if (cancelled || !state) return;
          setIsPlaying(!state.paused);
          const sdkArt = state.track_window?.current_track?.album?.images?.[0]?.url;
          if (sdkArt) {
            setCurrentTrack((prev) => ({ ...prev, artworkUrl: sdkArt }));
          }
        });

        player.addListener("initialization_error", ({ message }) => {
          console.error(">>> [Spotify SDK] Initialization error:", message);
          setPlaybackError(message);
        });

        player.addListener("authentication_error", ({ message }) => {
          console.error(">>> [Spotify SDK] Auth error:", message);
          setPlaybackError("Spotify playback auth error. Reconnect Spotify in Connected Services.");
        });

        player.addListener("account_error", ({ message }) => {
          console.error(">>> [Spotify SDK] Account error:", message);
          setPlaybackError("Spotify Web Playback SDK requires an active Spotify Premium account.");
        });

        const connected = await player.connect();
        console.log(">>> [Spotify SDK] connect() result:", connected);
      } catch (err) {
        console.error(">>> [Spotify SDK] Could not initialize:", err?.message || err);
      }
    })();

    return () => {
      cancelled = true;
      if (sdkPlayerRef.current) {
        sdkPlayerRef.current.disconnect();
        sdkPlayerRef.current = null;
      }
    };
  }, [connectionEpoch]);

  const hydrateTrackArtwork = useCallback(async (trackKey, uri, existingArt) => {
    if (existingArt) return;
    if (!uri) return;
    const liveArt = await fetchSpotifyTrackArtwork(uri);
    if (liveArt) {
      setCurrentTrack((prev) =>
        prev.trackKey === trackKey ? { ...prev, artworkUrl: liveArt } : prev
      );
    }
  }, []);

  const buildQueueTracks = useCallback((tracksList, activeIdx) => {
    return (tracksList || []).map((t, idx) => ({
      id: t.trackKey || t.id || idx,
      trackKey: t.trackKey || t.id || idx,
      title: t.title,
      artist: t.artist,
      album: t.album || "Master Vault",
      duration: t.duration || "",
      artworkUrl: t.artworkUrl || DEFAULT_TRACK.artworkUrl,
      uri: resolveSpotifyUri(t) || t.uri || null,
      narrative: t.narrative || t.commentary || null,
      status: idx < activeIdx ? "played" : idx === activeIdx ? "current" : "upcoming"
    }));
  }, []);

  const executeSpotifyTrackPlay = useCallback(async (track) => {
    const uri = resolveSpotifyUri(track);
    const routeInfo = {
      platform: "spotify",
      uri,
      deviceId: deviceIdRef.current,
      shouldPlay: true,
      title: track?.title,
      artist: track?.artist,
      timestamp: Date.now()
    };
    setLastPlaybackRoute(routeInfo);
    setPlaybackError(null);
    console.log(">>> [PlayerContext] Playback route:", routeInfo);

    if (!uri) {
      console.warn(">>> [PlayerContext] No Spotify URI on track; UI-only state updated.");
      return;
    }

    try {
      // Unlock browser audio output on user click gesture
      if (sdkPlayerRef.current?.activateElement) {
        await sdkPlayerRef.current.activateElement();
      }

      if (deviceIdRef.current) {
        await transferSpotifyPlayback(deviceIdRef.current, false);
        await playSpotifyUri({ uri, deviceId: deviceIdRef.current });
      } else {
        await playSpotifyUri({ uri });
      }
    } catch (err) {
      console.error(">>> [PlayerContext] Spotify playback failed:", err?.message || err);
      setPlaybackError(err?.message || "Could not start Spotify playback.");
    }
  }, []);

  const playTrack = useCallback(
    (track, contextOptions = {}) => {
      if (!track) return;

      const resolvedUri = resolveSpotifyUri(track) || track.uri || null;
      const trackKey = track.trackKey || track.id || Date.now();
      const normalizedTrack = {
        id: trackKey,
        trackKey,
        title: track.title || "Unknown Track",
        artist: track.artist || "Unknown Artist",
        album: track.album || "Master Vault",
        duration: track.duration || "",
        artworkUrl: track.artworkUrl || DEFAULT_TRACK.artworkUrl,
        uri: resolvedUri,
        narrative: track.narrative || track.commentary || null
      };

      setCurrentTrack(normalizedTrack);
      setIsPlaying(true);
      hydrateTrackArtwork(trackKey, resolvedUri, track.artworkUrl);
      executeSpotifyTrackPlay(normalizedTrack);

      if (Array.isArray(contextOptions.tracks) && contextOptions.tracks.length > 0) {
        const foundIdx = contextOptions.tracks.findIndex(
          (t) =>
            (t.trackKey && t.trackKey === normalizedTrack.trackKey) ||
            (t.id && t.id === normalizedTrack.id) ||
            (t.title === normalizedTrack.title && t.artist === normalizedTrack.artist)
        );
        const activeIdx = foundIdx >= 0 ? foundIdx : 0;
        setQueueIndex(activeIdx);
        setQueueMeta({
          name: contextOptions.name || "Library Queue",
          platforms: contextOptions.platforms || [{ name: "Spotify", icon: "🟢" }],
          tracks: buildQueueTracks(contextOptions.tracks, activeIdx)
        });
      }
    },
    [buildQueueTracks, executeSpotifyTrackPlay, hydrateTrackArtwork]
  );

  const togglePlay = useCallback(async () => {
    const nextPlaying = !isPlayingRef.current;
    setIsPlaying(nextPlaying);
    setPlaybackError(null);

    const uri = resolveSpotifyUri(currentTrackRef.current);

    try {
      if (sdkPlayerRef.current?.activateElement) {
        await sdkPlayerRef.current.activateElement();
      }

      if (!nextPlaying) {
        if (sdkPlayerRef.current && spotifyPlayerReady) {
          await sdkPlayerRef.current.pause();
        } else {
          await pauseSpotifyPlayback(deviceIdRef.current);
        }
      } else {
        if (deviceIdRef.current) {
          await transferSpotifyPlayback(deviceIdRef.current, false);
        }
        if (sdkPlayerRef.current && spotifyPlayerReady) {
          await sdkPlayerRef.current.resume();
        } else if (uri) {
          await playSpotifyUri({ uri, deviceId: deviceIdRef.current });
        } else {
          await resumeSpotifyPlayback(deviceIdRef.current);
        }
      }
    } catch (err) {
      console.error(">>> [PlayerContext] Toggle play failed:", err?.message || err);
      setPlaybackError(err?.message || "Could not toggle Spotify playback.");
    }
  }, [spotifyPlayerReady]);

  const selectQueueIndex = useCallback(
    (nextIdx) => {
      if (!queueMeta.tracks.length) return;
      const clamped = Math.max(0, Math.min(nextIdx, queueMeta.tracks.length - 1));
      const target = queueMeta.tracks[clamped];
      const resolvedUri = resolveSpotifyUri(target) || target.uri || null;
      const nextTrack = {
        id: target.id,
        trackKey: target.trackKey,
        title: target.title,
        artist: target.artist,
        album: target.album || "Master Vault",
        duration: target.duration || "",
        artworkUrl: target.artworkUrl || DEFAULT_TRACK.artworkUrl,
        uri: resolvedUri,
        narrative: target.narrative || target.commentary || null
      };

      setQueueIndex(clamped);
      setCurrentTrack(nextTrack);
      hydrateTrackArtwork(nextTrack.trackKey, resolvedUri, target.artworkUrl);
      setQueueMeta((prev) => ({
        ...prev,
        tracks: buildQueueTracks(prev.tracks, clamped)
      }));
      setIsPlaying(true);
      executeSpotifyTrackPlay(nextTrack);
    },
    [queueMeta.tracks, buildQueueTracks, executeSpotifyTrackPlay, hydrateTrackArtwork]
  );

  const playNext = useCallback(async () => {
    if (queueIndex < queueMeta.tracks.length - 1) {
      selectQueueIndex(queueIndex + 1);
      return;
    }
    try {
      await nextSpotifyTrack(deviceIdRef.current);
    } catch (err) {
      console.error(">>> [PlayerContext] Next track failed:", err?.message || err);
    }
  }, [queueIndex, queueMeta.tracks.length, selectQueueIndex]);

  const playPrevious = useCallback(async () => {
    if (queueIndex > 0) {
      selectQueueIndex(queueIndex - 1);
      return;
    }
    try {
      await previousSpotifyTrack(deviceIdRef.current);
    } catch (err) {
      console.error(">>> [PlayerContext] Previous track failed:", err?.message || err);
    }
  }, [queueIndex, selectQueueIndex]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        setIsPlaying,
        togglePlay,
        playTrack,
        playNext,
        playPrevious,
        selectQueueIndex,
        queueMeta,
        lastPlaybackRoute,
        spotifyDeviceId,
        spotifyPlayerReady,
        playbackError
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return ctx;
}