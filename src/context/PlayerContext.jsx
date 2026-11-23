import React, { createContext, useContext, useState, useCallback } from "react";

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

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(DEFAULT_TRACK);
  const [isPlaying, setIsPlaying] = useState(true);
  const [queueMeta, setQueueMeta] = useState(DEFAULT_QUEUE_META);
  const [queueIndex, setQueueIndex] = useState(2);
  const [lastPlaybackRoute, setLastPlaybackRoute] = useState(null);

  const buildQueueTracks = useCallback((tracksList, activeIdx) => {
    return (tracksList || []).map((t, idx) => ({
      id: t.trackKey || t.id || idx,
      trackKey: t.trackKey || t.id || idx,
      title: t.title,
      artist: t.artist,
      album: t.album || "Master Vault",
      duration: t.duration || "",
      artworkUrl: t.artworkUrl || DEFAULT_TRACK.artworkUrl,
      uri: t.uri || null,
      narrative: t.narrative || t.commentary || null,
      status: idx < activeIdx ? "played" : idx === activeIdx ? "current" : "upcoming"
    }));
  }, []);

  const routeTrackPlayback = useCallback((track, shouldPlay) => {
    const rawKey = String(track?.trackKey || track?.id || "");
    const spotifyId = rawKey.startsWith("spotify:") ? rawKey.split(":")[1] : null;
    const uri = track?.uri || (spotifyId ? `spotify:track:${spotifyId}` : null);

    const routeInfo = {
      platform: "spotify",
      uri,
      shouldPlay,
      title: track?.title,
      artist: track?.artist,
      timestamp: Date.now()
    };

    setLastPlaybackRoute(routeInfo);
    console.log(">>> [PlayerContext] Playback route:", routeInfo);
  }, []);

  const playTrack = useCallback(
    (track, contextOptions = {}) => {
      if (!track) return;

      const normalizedTrack = {
        id: track.trackKey || track.id || Date.now(),
        trackKey: track.trackKey || track.id || Date.now(),
        title: track.title || "Unknown Track",
        artist: track.artist || "Unknown Artist",
        album: track.album || "Master Vault",
        duration: track.duration || "",
        artworkUrl: track.artworkUrl || DEFAULT_TRACK.artworkUrl,
        uri: track.uri || null,
        narrative: track.narrative || track.commentary || null
      };

      setCurrentTrack(normalizedTrack);
      setIsPlaying(true);
      routeTrackPlayback(normalizedTrack, true);

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
    [buildQueueTracks, routeTrackPlayback]
  );

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      routeTrackPlayback(currentTrack, next);
      return next;
    });
  }, [currentTrack, routeTrackPlayback]);

  const selectQueueIndex = useCallback(
    (nextIdx) => {
      if (!queueMeta.tracks.length) return;
      const clamped = Math.max(0, Math.min(nextIdx, queueMeta.tracks.length - 1));
      const target = queueMeta.tracks[clamped];
      const nextTrack = {
        id: target.id,
        trackKey: target.trackKey,
        title: target.title,
        artist: target.artist,
        album: target.album || "Master Vault",
        duration: target.duration || "",
        artworkUrl: target.artworkUrl || DEFAULT_TRACK.artworkUrl,
        uri: target.uri || null,
        narrative: target.narrative || target.commentary || null
      };

      setQueueIndex(clamped);
      setCurrentTrack(nextTrack);
      setQueueMeta((prev) => ({
        ...prev,
        tracks: buildQueueTracks(prev.tracks, clamped)
      }));
      setIsPlaying(true);
      routeTrackPlayback(nextTrack, true);
    },
    [queueMeta.tracks, buildQueueTracks, routeTrackPlayback]
  );

  const playNext = useCallback(() => {
    if (queueIndex < queueMeta.tracks.length - 1) {
      selectQueueIndex(queueIndex + 1);
    }
  }, [queueIndex, queueMeta.tracks.length, selectQueueIndex]);

  const playPrevious = useCallback(() => {
    if (queueIndex > 0) {
      selectQueueIndex(queueIndex - 1);
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
        lastPlaybackRoute
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