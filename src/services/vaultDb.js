// src/services/vaultDb.js

import Dexie from 'dexie';

export const vaultDb = new Dexie('GapvizMasterVault');

vaultDb.version(1).stores({
  tracks: '++id, &trackKey, title, artist, album, platform, playlistId, addedAt, isArchived',
  playlists: '++id, &playlistKey, name, platform, isPinned, isVoiceDeckSession, djPersona',
  storyCache: '&trackKey, djPersona, updatedAt'
});

// v2: playlist membership (a track can live in many playlists) + resumable sync checkpoints
vaultDb.version(2).stores({
  tracks: '++id, &trackKey, title, artist, album, platform, playlistId, addedAt, isArchived',
  playlists: '++id, &playlistKey, name, platform, isPinned, isVoiceDeckSession, djPersona',
  storyCache: '&trackKey, djPersona, updatedAt',
  playlistTracks: '[playlistKey+trackKey], playlistKey, trackKey',
  syncState: 'key'
});

export function buildTrackKey(platform, platformTrackId, title, artist) {
  if (platformTrackId) return `${platform}:${platformTrackId}`;
  return `${platform}:${String(title || '').toLowerCase().trim()}-${String(artist || '').toLowerCase().trim()}`;
}

export async function getAllVaultTracks() {
  return await vaultDb.tracks.where('isArchived').equals(0).toArray();
}

// Playlists for a platform: pinned first (Liked Songs), then in the order Spotify returned them
export async function getVaultPlaylists(platform = 'spotify') {
  const rows = await vaultDb.playlists.where('platform').equals(platform).toArray();
  return rows.sort(
    (a, b) => (b.isPinned || 0) - (a.isPinned || 0) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
}

// Tracks in one playlist, in playlist order
export async function getPlaylistTracks(playlistKey) {
  const links = await vaultDb.playlistTracks.where('playlistKey').equals(playlistKey).toArray();
  links.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const keys = links.map((l) => l.trackKey);
  const tracks = await vaultDb.tracks.where('trackKey').anyOf(keys).toArray();
  const byKey = new Map(tracks.map((t) => [t.trackKey, t]));
  return keys.map((k) => byKey.get(k)).filter(Boolean);
}