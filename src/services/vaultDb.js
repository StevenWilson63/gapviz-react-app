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

// Playlists: if platform is specified, filter by it. Otherwise, return all playlists (spotify + custom).
export async function getVaultPlaylists(platform = null) {
  const rows = platform
    ? await vaultDb.playlists.where('platform').equals(platform).toArray()
    : await vaultDb.playlists.toArray();

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

// How many tracks are actually stored for each playlist: { playlistKey: count }
export async function getPlaylistTrackCounts() {
  const counts = {};
  await vaultDb.playlistTracks.each((link) => {
    counts[link.playlistKey] = (counts[link.playlistKey] || 0) + 1;
  });
  return counts;
}

// Hide / restore a playlist in the library. Archived playlists stay archived across re-syncs
export async function setPlaylistArchived(playlistKey, archived) {
  await vaultDb.playlists
    .where('playlistKey')
    .equals(playlistKey)
    .modify({ isArchived: archived ? 1 : 0 });
}

// Ask the next sync to try reading this playlist's tracks again
export async function requeuePlaylist(playlistKey) {
  await vaultDb.playlists.where('playlistKey').equals(playlistKey).modify({ restrictedAt: 0 });
}