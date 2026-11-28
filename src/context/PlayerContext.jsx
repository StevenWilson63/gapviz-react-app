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

const LAST_PLAYBACK_STORAGE_KEY = "gapviz_last_playback_state_v1";

const DEFAULT_TRACK = {
  id: "default-dreams",
  trackKey: "default-dreams",
  title: "Dreams",
  artist: "Fleetwood Mac",
  album: "Rumours (1977)",
  duration: "4:17",
  durationMs: 257000,
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

const parseDurationToMs = (track) => {
  if (typeof track?.durationMs === "number" && track.durationMs > 0) {
    return track.durationMs;
  }
  if (typeof track?.duration === "string" && track.duration.includes(":")) {
    const [m, s] = track.duration.split(":").map(Number);
    if (!Number.isNaN(m) && !Number.isNaN(s)) {
      return (m * 60 + s) * 1000;
    }
  }
  return 0;
};

const loadSavedPlaybackState = () => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(LAST_PLAYBACK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.currentTrack) return null;

    const savedTrack = {
      ...DEFAULT_TRACK,
      ...parsed.currentTrack,
      durationMs: parseDurationToMs(parsed.currentTrack) || DEFAULT_TRACK.durationMs
    };

    const savedQueueMeta =
      parsed.queueMeta && typeof parsed.queueMeta === "object" && Array.isArray(parsed.queueMeta.tracks)
        ? {
            name: parsed.queueMeta.name || "Library Queue",
            platforms: Array.isArray(parsed.queueMeta.platforms) && parsed.queueMeta.platforms.length > 0
              ? parsed.queueMeta.platforms
              : [{ name: "Spotify", icon: "🟢" }],
            tracks: parsed.queueMeta.tracks
          }
        : DEFAULT_QUEUE_META;

    const savedQueueIndex =
      typeof parsed.queueIndex === "number" && parsed.queueIndex >= 0
        ? parsed.queueIndex
        : 0;

    return {
      currentTrack: savedTrack,
      durationMs: savedTrack.durationMs || DEFAULT_TRACK.durationMs,
      queueMeta: savedQueueMeta,
      queueIndex: savedQueueIndex
    };
  } catch (err) {
    console.warn(">>> [PlayerContext] Could not read saved playback state:", err);
    return null;
  }
};

const persistPlaybackState = (track, qMeta, qIndex) => {
  try {
    if (typeof window === "undefined" || !window.localStorage || !track) return;
    const compactTracks = Array.isArray(qMeta?.tracks)
      ? qMeta.tracks.slice(0, 100).map((t, idx) => ({
          id: t.id ?? t.trackKey ?? idx,
          trackKey: t.trackKey ?? t.id ?? idx,
          title: t.title || "Unknown Track",
          artist: t.artist || "Unknown Artist",
          album: t.album || "Master Vault",
          duration: t.duration || "",
          durationMs: parseDurationToMs(t),
          artworkUrl: t.artworkUrl || "",
          uri: resolveSpotifyUri(t) || t.uri || null,
          status: t.status || "upcoming"
        }))
      : [];

    const payload = {
      currentTrack: {
        id: track.id,
        trackKey: track.trackKey,
        title: track.title,
        artist: track.artist,
        album: track.album || "Master Vault",
        duration: track.duration || "",
        durationMs: parseDurationToMs(track),
        artworkUrl: track.artworkUrl || DEFAULT_TRACK.artworkUrl,
        uri: resolveSpotifyUri(track) || track.uri || null,
        narrative: track.narrative || track.commentary || null
      },
      queueMeta: {
        name: qMeta?.name || "Library Queue",
        platforms: Array.isArray(qMeta?.platforms) && qMeta.platforms.length > 0
          ? qMeta.platforms
          : [{ name: "Spotify", icon: "🟢" }],
        tracks: compactTracks
      },
      queueIndex: typeof qIndex === "number" ? qIndex : 0,
      savedAt: Date.now()
    };

    window.localStorage.setItem(LAST_PLAYBACK_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn(">>> [PlayerContext] Could not persist playback state:", err);
  }
};

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const initialStateRef = useRef(null);
  if (!initialStateRef.current) {
    initialStateRef.current = loadSavedPlaybackState() || {
      currentTrack: DEFAULT_TRACK,
      durationMs: DEFAULT_TRACK.durationMs,
      queueMeta: DEFAULT_QUEUE_META,
      queueIndex: 2
    };
  }

  const [currentTrack, setCurrentTrack] = useState(initialStateRef.current.currentTrack);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(initialStateRef.current.durationMs);
  const [volume, setVolumeState] = useState(0.8);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState("off"); // 'off' | 'context' | 'track'
  const [queueMeta, setQueueMeta] = useState(initialStateRef.current.queueMeta);
  const [queueIndex, setQueueIndex] = useState(initialStateRef.current.queueIndex);
  const [lastPlaybackRoute, setLastPlaybackRoute] = useState(null);
  const [spotifyDeviceId, setSpotifyDeviceId] = useState(null);
  const [spotifyPlayerReady, setSpotifyPlayerReady] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);
  const [connectionEpoch, setConnectionEpoch] = useState(0);

  const sdkPlayerRef = useRef(null);
  const deviceIdRef = useRef(null);
  const currentTrackRef = useRef(currentTrack);
  const isPlayingRef = useRef(isPlaying);
  const repeatModeRef = useRef(repeatMode);
  const isShuffledRef = useRef(isShuffled);
  const queueMetaRef = useRef(queueMeta);
  const queueIndexRef = useRef(queueIndex);
  const durationMsRef = useRef(durationMs);
  const positionMsRef = useRef(positionMs);
  const isTogglingRef = useRef(false);
  const seekingLockRef = useRef(false);
  const lastSdkTrackUriRef = useRef(null);
  const maxSeenPosMsRef = useRef(0);
  const advancingRef = useRef(false);
  const playNextRef = useRef(null);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    isShuffledRef.current = isShuffled;
  }, [isShuffled]);

  useEffect(() => {
    queueMetaRef.current = queueMeta;
  }, [queueMeta]);

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  useEffect(() => {
    durationMsRef.current = durationMs;
  }, [durationMs]);

  useEffect(() => {
    positionMsRef.current = positionMs;
  }, [positionMs]);

  useEffect(() => {
    if (currentTrack?.id === DEFAULT_TRACK.id && queueMeta?.name === DEFAULT_QUEUE_META.name) {
      return;
    }
    persistPlaybackState(currentTrack, queueMeta, queueIndex);
  }, [currentTrack, queueMeta, queueIndex]);

  const triggerEndOfTrack = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setTimeout(() => {
      playNextRef.current?.();
    }, 0);
  }, []);

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
        const player = await createSpotifySdkPlayer({ name: "Gapviz Web Player", volume });
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
            // Safe to ignore until playback starts
          }
        });

        player.addListener("not_ready", ({ device_id }) => {
          if (cancelled) return;
          console.warn(">>> [Spotify SDK] Device went offline:", device_id);
          setSpotifyPlayerReady(false);
        });

        player.addListener("player_state_changed", (state) => {
          if (cancelled || !state) return;

          const sdkTrackUri = state.track_window?.current_track?.uri || null;
          const sdkDur = typeof state.duration === "number" && state.duration > 0 ? state.duration : 0;
          const sdkPos = typeof state.position === "number" ? state.position : 0;
          const prevSdkUri = lastSdkTrackUriRef.current;

          if (sdkDur > 0) {
            setDurationMs(sdkDur);
            durationMsRef.current = sdkDur;
          }

          if (sdkPos > maxSeenPosMsRef.current) {
            maxSeenPosMsRef.current = sdkPos;
          }

          if (!seekingLockRef.current && typeof state.position === "number") {
            setPositionMs(sdkPos);
            positionMsRef.current = sdkPos;
          }

          const activeUri = resolveSpotifyUri(currentTrackRef.current) || currentTrackRef.current?.uri;
          const sdkArt = state.track_window?.current_track?.album?.images?.[0]?.url;
          if (sdkArt && sdkTrackUri && activeUri && sdkTrackUri === activeUri) {
            setCurrentTrack((prev) => ({ ...prev, artworkUrl: sdkArt }));
          }

          // Detect natural track completion when SDK switches URI after active playback
          if (
            prevSdkUri &&
            sdkTrackUri &&
            prevSdkUri !== sdkTrackUri &&
            maxSeenPosMsRef.current > 0 &&
            isPlayingRef.current
          ) {
            lastSdkTrackUriRef.current = sdkTrackUri;
            maxSeenPosMsRef.current = 0;
            triggerEndOfTrack();
            return;
          }

          if (sdkTrackUri) {
            lastSdkTrackUriRef.current = sdkTrackUri;
          }

          // Detect end-of-track pause near duration boundary (including after scrubbing near end)
          const effectiveDur = sdkDur || durationMsRef.current;
          const nearEnd =
            effectiveDur > 0 &&
            (sdkPos >= effectiveDur - 1500 || maxSeenPosMsRef.current >= effectiveDur - 1500);

          if (state.paused && nearEnd && isPlayingRef.current && !isTogglingRef.current) {
            triggerEndOfTrack();
            return;
          }

          if (!isTogglingRef.current) {
            setIsPlaying(!state.paused);
          }
        });

        player.addListener("playback_error", ({ message }) => {
          console.error(">>> [Spotify SDK] Playback error:", message);
          setPlaybackError(message);
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

        await player.connect();
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
  }, [connectionEpoch, triggerEndOfTrack]);

  const hydrateTrackArtwork = useCallback(async (trackKey, uri, existingArt) => {
    if (existingArt || !uri) return;
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
      durationMs: parseDurationToMs(t),
      artworkUrl: t.artworkUrl || DEFAULT_TRACK.artworkUrl,
      uri: resolveSpotifyUri(t) || t.uri || null,
      narrative: t.narrative || t.commentary || null,
      status: idx < activeIdx ? "played" : idx === activeIdx ? "current" : "upcoming"
    }));
  }, []);

  const executeSpotifyTrackPlay = useCallback(async (track, startMs = 0) => {
    const uri = resolveSpotifyUri(track);
    const routeInfo = {
      platform: "spotify",
      uri,
      deviceId: deviceIdRef.current,
      positionMs: startMs,
      shouldPlay: true,
      title: track?.title,
      artist: track?.artist,
      timestamp: Date.now()
    };
    setLastPlaybackRoute(routeInfo);
    setPlaybackError(null);
    console.log(">>> [PlayerContext] Playback route:", routeInfo);

    if (!uri) {
      setPlaybackError("No Spotify URI available for this track.");
      return;
    }

    try {
      if (sdkPlayerRef.current?.activateElement) {
        await sdkPlayerRef.current.activateElement();
      }
      await playSpotifyUri({
        uri,
        deviceId: deviceIdRef.current,
        positionMs: startMs
      });
    } catch (err) {
      console.error(">>> [PlayerContext] Spotify playback failed:", err?.message || err);
      setPlaybackError(err?.message || "Could not start Spotify playback.");
    }
  }, []);

  const playTrack = useCallback(
    (track, contextOptions = {}) => {
      if (!track) return;

      advancingRef.current = false;
      maxSeenPosMsRef.current = 0;
      const resolvedUri = resolveSpotifyUri(track) || track.uri || null;
      if (resolvedUri) {
        lastSdkTrackUriRef.current = resolvedUri;
      }
      const trackKey = track.trackKey || track.id || Date.now();
      const trackDurMs = parseDurationToMs(track);
      const normalizedTrack = {
        id: trackKey,
        trackKey,
        title: track.title || "Unknown Track",
        artist: track.artist || "Unknown Artist",
        album: track.album || "Master Vault",
        duration: track.duration || "",
        durationMs: trackDurMs,
        artworkUrl: track.artworkUrl || DEFAULT_TRACK.artworkUrl,
        uri: resolvedUri,
        narrative: track.narrative || track.commentary || null
      };

      setPositionMs(0);
      positionMsRef.current = 0;
      setDurationMs(trackDurMs || DEFAULT_TRACK.durationMs);
      setCurrentTrack(normalizedTrack);
      setIsPlaying(true);

      let nextQueueMeta = queueMetaRef.current;
      let nextQueueIndex = queueIndexRef.current;

      if (Array.isArray(contextOptions.tracks) && contextOptions.tracks.length > 0) {
        const foundIdx = contextOptions.tracks.findIndex(
          (t) =>
            (t.trackKey && t.trackKey === normalizedTrack.trackKey) ||
            (t.id && t.id === normalizedTrack.id) ||
            (t.title === normalizedTrack.title && t.artist === normalizedTrack.artist)
        );
        const activeIdx = foundIdx >= 0 ? foundIdx : 0;
        nextQueueIndex = activeIdx;
        nextQueueMeta = {
          name: contextOptions.name || "Library Queue",
          platforms: contextOptions.platforms || [{ name: "Spotify", icon: "🟢" }],
          tracks: buildQueueTracks(contextOptions.tracks, activeIdx)
        };
        setQueueIndex(nextQueueIndex);
        setQueueMeta(nextQueueMeta);
      }

      persistPlaybackState(normalizedTrack, nextQueueMeta, nextQueueIndex);
      hydrateTrackArtwork(trackKey, resolvedUri, track.artworkUrl);
      executeSpotifyTrackPlay(normalizedTrack, 0);
    },
    [buildQueueTracks, executeSpotifyTrackPlay, hydrateTrackArtwork]
  );

  const togglePlay = useCallback(async () => {
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;

    const nextPlaying = !isPlayingRef.current;
    setIsPlaying(nextPlaying);
    setPlaybackError(null);

    try {
      if (sdkPlayerRef.current?.activateElement) {
        await sdkPlayerRef.current.activateElement();
      }

      if (!nextPlaying) {
        if (sdkPlayerRef.current && spotifyPlayerReady) {
          await sdkPlayerRef.current.pause();
        }
        await pauseSpotifyPlayback(deviceIdRef.current);
      } else {
        advancingRef.current = false;
        if (sdkPlayerRef.current && spotifyPlayerReady) {
          await sdkPlayerRef.current.resume();
        }
        await resumeSpotifyPlayback(deviceIdRef.current);
      }
    } catch (err) {
      console.error(">>> [PlayerContext] Toggle play failed:", err?.message || err);
      setPlaybackError(err?.message || "Could not toggle Spotify playback.");
    } finally {
      setTimeout(() => {
        isTogglingRef.current = false;
      }, 250);
    }
  }, [spotifyPlayerReady]);

  const seekToMs = useCallback(async (targetMs) => {
    const dur = durationMsRef.current;
    const clamped = Math.max(0, Math.min(Math.round(targetMs), dur > 0 ? dur : Math.round(targetMs)));
    advancingRef.current = false;
    maxSeenPosMsRef.current = clamped;
    seekingLockRef.current = true;
    setPositionMs(clamped);
    positionMsRef.current = clamped;

    try {
      if (sdkPlayerRef.current?.seek) {
        await sdkPlayerRef.current.seek(clamped);
      }
    } catch (err) {
      console.error(">>> [PlayerContext] Seek failed:", err?.message || err);
    } finally {
      setTimeout(() => {
        seekingLockRef.current = false;
      }, 300);
    }
  }, []);

  const setVolume = useCallback(async (nextVolume) => {
    const clamped = Math.max(0, Math.min(1, Number(nextVolume)));
    setVolumeState(clamped);
    try {
      if (sdkPlayerRef.current?.setVolume) {
        await sdkPlayerRef.current.setVolume(clamped);
      }
    } catch (err) {
      console.error(">>> [PlayerContext] Volume update failed:", err?.message || err);
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => !prev);
  }, []);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "off") return "context";
      if (prev === "context") return "track";
      return "off";
    });
  }, []);

  const selectQueueIndex = useCallback(
    (nextIdx) => {
      const tracks = queueMetaRef.current.tracks || [];
      if (!tracks.length) return;
      maxSeenPosMsRef.current = 0;
      const clamped = Math.max(0, Math.min(nextIdx, tracks.length - 1));
      const target = tracks[clamped];
      const resolvedUri = resolveSpotifyUri(target) || target.uri || null;
      if (resolvedUri) {
        lastSdkTrackUriRef.current = resolvedUri;
      }
      const trackDurMs = parseDurationToMs(target);
      const nextTrack = {
        id: target.id,
        trackKey: target.trackKey,
        title: target.title,
        artist: target.artist,
        album: target.album || "Master Vault",
        duration: target.duration || "",
        durationMs: trackDurMs,
        artworkUrl: target.artworkUrl || DEFAULT_TRACK.artworkUrl,
        uri: resolvedUri,
        narrative: target.narrative || target.commentary || null
      };

      const updatedQueueMeta = {
        ...queueMetaRef.current,
        tracks: buildQueueTracks(tracks, clamped)
      };

      setPositionMs(0);
      positionMsRef.current = 0;
      setDurationMs(trackDurMs || DEFAULT_TRACK.durationMs);
      setQueueIndex(clamped);
      setCurrentTrack(nextTrack);
      setQueueMeta(updatedQueueMeta);
      persistPlaybackState(nextTrack, updatedQueueMeta, clamped);
      hydrateTrackArtwork(nextTrack.trackKey, resolvedUri, target.artworkUrl);
      setIsPlaying(true);
      executeSpotifyTrackPlay(nextTrack, 0);
      setTimeout(() => {
        advancingRef.current = false;
      }, 500);
    },
    [buildQueueTracks, executeSpotifyTrackPlay, hydrateTrackArtwork]
  );

  const playNext = useCallback(async () => {
    const mode = repeatModeRef.current;
    const shuffled = isShuffledRef.current;
    const tracks = queueMetaRef.current.tracks || [];
    const currentIdx = queueIndexRef.current;

    if (mode === "track") {
      maxSeenPosMsRef.current = 0;
      setPositionMs(0);
      positionMsRef.current = 0;
      setIsPlaying(true);
      await executeSpotifyTrackPlay(currentTrackRef.current, 0);
      setTimeout(() => {
        advancingRef.current = false;
      }, 500);
      return;
    }

    if (tracks.length > 0) {
      if (shuffled && tracks.length > 1) {
        const candidates = tracks.map((_, idx) => idx).filter((idx) => idx !== currentIdx);
        const randomIdx = candidates[Math.floor(Math.random() * candidates.length)];
        selectQueueIndex(randomIdx);
        return;
      }

      if (currentIdx < tracks.length - 1) {
        selectQueueIndex(currentIdx + 1);
        return;
      }

      if (mode === "context") {
        selectQueueIndex(0);
        return;
      }
    }

    try {
      await nextSpotifyTrack(deviceIdRef.current);
    } catch (err) {
      console.error(">>> [PlayerContext] Next track failed:", err?.message || err);
    } finally {
      setTimeout(() => {
        advancingRef.current = false;
      }, 500);
    }
  }, [selectQueueIndex, executeSpotifyTrackPlay]);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const playPrevious = useCallback(async () => {
    advancingRef.current = false;
    maxSeenPosMsRef.current = 0;
    if (repeatModeRef.current === "track") {
      setPositionMs(0);
      positionMsRef.current = 0;
      setIsPlaying(true);
      await executeSpotifyTrackPlay(currentTrackRef.current, 0);
      return;
    }

    if (queueIndexRef.current > 0) {
      selectQueueIndex(queueIndexRef.current - 1);
      return;
    }

    if (repeatModeRef.current === "context" && (queueMetaRef.current.tracks || []).length > 0) {
      selectQueueIndex(queueMetaRef.current.tracks.length - 1);
      return;
    }

    try {
      await previousSpotifyTrack(deviceIdRef.current);
    } catch (err) {
      console.error(">>> [PlayerContext] Previous track failed:", err?.message || err);
    }
  }, [selectQueueIndex, executeSpotifyTrackPlay]);

  // Live progress tick + automatic end-of-track advance/repeat within 1.5s of end
  useEffect(() => {
    if (!isPlaying) return undefined;
    const interval = setInterval(() => {
      setPositionMs((prev) => {
        const dur = durationMsRef.current;
        const next = prev + 1000;
        if (dur > 0 && next >= dur - 1500) {
          triggerEndOfTrack();
          return dur;
        }
        positionMsRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, triggerEndOfTrack]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        setIsPlaying,
        positionMs,
        durationMs,
        volume,
        setVolume,
        seekToMs,
        isShuffled,
        repeatMode,
        toggleShuffle,
        cycleRepeatMode,
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