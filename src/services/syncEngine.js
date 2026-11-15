import { vaultDb, buildTrackKey } from './vaultDb';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
        : await enrichTrackMetadata(item.title, item.artist);

      enrichedRecords.push({
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
      });

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