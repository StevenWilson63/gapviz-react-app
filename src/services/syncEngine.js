// src/services/syncEngine.js

import { vaultDb, buildTrackKey } from './vaultDb';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Optional enrichment from iTunes. NOT used in the main Spotify sync any more
// (Spotify already supplies artwork, duration and URI). The iTunes Search API has
// its own low rate limit, so only call this lazily, one track at a time.
export async function enrichTrackMetadata(title, artist) {
  try {
    const query = encodeURIComponent(`${title} ${artist}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
    if (!res.ok) return {};
    const data = await res.json();
    const match = data.results?.[0];
    if (!match) return {};

    return {
      artworkUrl: match.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
      genre: match.primaryGenreName || 'Unknown',
      previewUrl: match.previewUrl || '',
      releaseYear: match.releaseDate ? new Date(match.releaseDate).getFullYear() : null
    };
  } catch {
    return {};
  }
}

/**
 * Save one page of tracks (from any platform) plus their playlist membership.
 * Safe to call repeatedly: existing tracks are updated in place, never duplicated.
 */
export async function saveTrackPage({ platform, playlistKey, tracks, offset = 0 }) {
  if (!tracks || tracks.length === 0) return;

  const keys = tracks.map((t) => buildTrackKey(platform, t.id, t.title, t.artist));
  const existing = await vaultDb.tracks.where('trackKey').anyOf(keys).toArray();
  const byKey = new Map(existing.map((e) => [e.trackKey, e]));

  // De-dupe inside the page (same song twice in one playlist) to avoid unique-key errors
  const records = new Map();
  tracks.forEach((t, i) => {
    const trackKey = keys[i];
    if (records.has(trackKey)) return;
    const prev = byKey.get(trackKey);
    const rec = {
      ...(prev || {}),
      trackKey,
      title: t.title,
      artist: t.artist,
      album: t.album || 'Single',
      durationMs: t.durationMs || prev?.durationMs || 0,
      platform,
      platformUri: t.uri || prev?.platformUri || '',
      artworkUrl: t.artworkUrl || prev?.artworkUrl || '',
      releaseYear: t.releaseYear ?? prev?.releaseYear ?? null,
      addedAt: prev?.addedAt || t.addedAt || Date.now(),
      isArchived: prev ? prev.isArchived : 0
    };
    if (prev) rec.id = prev.id; // keeps the existing row instead of violating the unique trackKey index
    records.set(trackKey, rec);
  });

  const links = keys.map((trackKey, i) => ({
    playlistKey,
    trackKey,
    position: offset + i
  }));

  await vaultDb.transaction('rw', vaultDb.tracks, vaultDb.playlistTracks, async () => {
    await vaultDb.tracks.bulkPut([...records.values()]);
    await vaultDb.playlistTracks.bulkPut(links);
  });
}

// Legacy batch importer, kept for any other callers. Fixed so a second run no longer
// throws a BulkError (existing rows now keep their id).
export async function runChunkedVaultSync({ platform, rawTracks, onProgress, signal }) {
  const BATCH_SIZE = 50;
  const total = rawTracks.length;
  let processed = 0;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    if (signal?.aborted) break;

    const batch = rawTracks.slice(i, i + BATCH_SIZE);
    const enrichedRecords = [];

    for (const item of batch) {
      const trackKey = buildTrackKey(platform, item.id, item.title, item.artist);
      const existing = await vaultDb.tracks.get({ trackKey });

      const enrichment = existing?.artworkUrl
        ? {
            artworkUrl: existing.artworkUrl,
            genre: existing.genre,
            previewUrl: existing.previewUrl,
            releaseYear: existing.releaseYear
          }
        : item.artworkUrl
        ? { artworkUrl: item.artworkUrl, releaseYear: item.releaseYear ?? null }
        : await enrichTrackMetadata(item.title, item.artist);

      const rec = {
        trackKey,
        title: item.title,
        artist: item.artist,
        album: item.album || 'Single',
        durationMs: item.durationMs || 0,
        platform,
        platformUri: item.uri || '',
        playlistId: item.playlistId || 'liked',
        addedAt: item.addedAt || Date.now(),
        isArchived: existing ? existing.isArchived : 0,
        ...enrichment
      };
      if (existing) rec.id = existing.id;
      enrichedRecords.push(rec);

      processed += 1;
      onProgress?.({
        platform,
        processed,
        total,
        percent: Math.round((processed / total) * 100),
        currentTrack: `'${item.title}' - ${item.artist}`
      });
    }

    await vaultDb.tracks.bulkPut(enrichedRecords);

    if (i + BATCH_SIZE < total) {
      await sleep(200);
    }
  }
}