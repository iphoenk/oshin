import { normalizeEarthquakeSnapshot } from './records.js';
import { createUsgsEarthquakeSource } from './source.js';

const BMKG_PROXY_URL = '/api/oshin/bmkg';

/**
 * The BMKG API is an event bulletin, not a complete 24-hour earthquake
 * catalog. Merge three officially published bulletins and preserve identity
 * across duplicate appearances. Only points with valid coordinates and
 * magnitudes can enter the Cesium layer.
 */
export function normalizeBmkgPayload(payload) {
  if (!Array.isArray(payload?.feeds)) return null;
  const merged = new Map();
  let successfulFeeds = 0;

  for (const feed of payload.feeds) {
    if (feed?.ok !== true || !Array.isArray(feed.gempa)) continue;
    successfulFeeds += 1;

    for (const event of feed.gempa) {
      if (!event || typeof event !== 'object' || Array.isArray(event))
        continue;
      const coordinates = String(event.Coordinates ?? '').split(',');
      if (coordinates.length !== 2) continue;
      const lat = Number(coordinates[0]);
      const lon = Number(coordinates[1]);
      const mag = Number(event.Magnitude);
      const depthRaw = String(event.Kedalaman ?? '').replace(',', '.');
      const depthMatch = /^\s*(\d+(?:\.\d+)?)\s*km\b/i.exec(depthRaw);
      const depthKm = depthMatch ? Number(depthMatch[1]) : null;
      if (
        !Number.isFinite(lat) || Math.abs(lat) > 90 ||
        !Number.isFinite(lon) || Math.abs(lon) > 180 ||
        !Number.isFinite(mag) || mag < 0 || mag > 10 ||
        (depthKm != null && (!Number.isFinite(depthKm) || depthKm < 0))
      ) continue;

      const rawTime = String(event.DateTime ?? '');
      const parsedTime = rawTime ? Date.parse(rawTime) : NaN;
      const time = Number.isFinite(parsedTime) ? parsedTime : null;
      const identity = [
        rawTime || String(event.Tanggal ?? '') + String(event.Jam ?? ''),
        lat.toFixed(4), lon.toFixed(4),
      ].join('|');

      if (!merged.has(identity)) {
        merged.set(identity, {
          stableId: 'bmkg:' + identity,
          usgsId: 'bmkg:' + identity,
          lon,
          lat,
          depthKm,
          mag,
          place: String(event.Wilayah ?? '').trim() || null,
          time,
        });
      }
    }
  }
  if (successfulFeeds === 0) return null;
  // An empty but valid bulletin is allowed. Never substitute fake events.
  return [...merged.values()].filter((event) => event.mag >= 2.5);
}

/**
 * Same source contract as USGS. BMKG is preferred in a browser, while the
 * existing USGS source is used only after an unavailable/malformed BMKG feed.
 * This keeps the last-good Cesium layer behavior unchanged.
 */
export function createBmkgEarthquakeSource({
  fetchImpl = (...args) => globalThis.fetch(...args),
  fallbackSource = createUsgsEarthquakeSource({ fetchImpl }),
  endpoint = BMKG_PROXY_URL,
} = {}) {
  return {
    label: 'BMKG (USGS fallback)',
    async getSnapshot({ signal } = {}) {
      signal?.throwIfAborted();
      try {
        const response = await fetchImpl(endpoint, { signal });
        if (!response.ok) throw new Error('BMKG HTTP ' + response.status);
        const payload = await response.json();
        signal?.throwIfAborted();
        const rows = normalizeBmkgPayload(payload);
        if (rows === null) throw new Error('Malformed BMKG response');
        return rows;
      } catch (error) {
        signal?.throwIfAborted();
        if (!fallbackSource?.getSnapshot) throw error;
        return fallbackSource.getSnapshot({ signal });
      }
    },
  };
}
