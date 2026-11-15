import Dexie from 'dexie';

export const vaultDb = new Dexie('GapvizMasterVault');

vaultDb.version(1).stores({
  tracks: '++id, &trackKey, title, artist, album, platform, playlistId, addedAt, isArchived',
  playlists: '++id, &playlistKey, name, platform, isPinned, isVoiceDeckSession, djPersona',
  storyCache: '&trackKey, djPersona, updatedAt'
});

export function buildTrackKey(platform, platformTrackId, title, artist) {
  if (platformTrackId) return `${platform}:${platformTrackId}`;
  return `${platform}:${title.toLowerCase().trim()}-${artist.toLowerCase().trim()}`;
}
// Add this helper function at the bottom of src/services/vaultDb.js
export async function getAllVaultTracks() {
  return await vaultDb.tracks.where('isArchived').equals(0).toArray();
}