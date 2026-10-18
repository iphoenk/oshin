import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createBmkgEarthquakeSource,
  normalizeBmkgPayload,
} from './bmkg.js';

const event = {
  DateTime: '2026-10-18T10:40:00+00:00',
  Coordinates: '-6.124,106.778',
  Magnitude: '5.2',
  Kedalaman: '12 km',
  Wilayah: 'Jakarta, Indonesia',
};

test('BMKG bulletins map to the existing earthquake source contract', () => {
  const rows = normalizeBmkgPayload({
    feeds: [{ kind: 'latest', ok: true, gempa: [event] }],
  });
  assert.deepEqual(rows, [{
    stableId: 'bmkg:2026-10-18T10:40:00+00:00|-6.1240|106.7780',
    usgsId: 'bmkg:2026-10-18T10:40:00+00:00|-6.1240|106.7780',
    lat: -6.124,
    lon: 106.778,
    mag: 5.2,
    depthKm: 12,
    place: 'Jakarta, Indonesia',
    time: Date.parse(event.DateTime),
  }]);
});

test('duplicates across bulletins do not multiply observations', () => {
  const rows = normalizeBmkgPayload({
    feeds: [
      { kind: 'latest', ok: true, gempa: [event] },
      { kind: 'felt', ok: true, gempa: [event] },
    ],
  });
  assert.equal(rows.length, 1);
});

test('malformed location and sub-M2.5 events do not become map objects', () => {
  const rows = normalizeBmkgPayload({
    feeds: [{ kind: 'felt', ok: true, gempa: [
      { ...event, Coordinates: '999,999' },
      { ...event, DateTime: '2026-10-18T10:41:00+00:00', Magnitude: '2.1' },
      event,
    ] }],
  });
  assert.equal(rows.length, 1);
  assert.equal(normalizeBmkgPayload({ feeds: [{ kind: 'major', ok: false, gempa: [] }] }), null);
});

test('BMKG adapter uses official proxy when response validates', async () => {
  const fetchImpl = async (url) => {
    assert.equal(url, '/api/oshin/bmkg');
    return { ok: true, json: async () => ({
      feeds: [{ kind: 'latest', ok: true, gempa: [event] }],
    }) };
  };
  const source = createBmkgEarthquakeSource({
    fetchImpl,
    fallbackSource: { getSnapshot() { throw new Error('fallback should not run'); } },
  });
  const rows = await source.getSnapshot();
  assert.equal(rows[0].mag, 5.2);
});

test('unavailable BMKG falls back to existing USGS source without inventing data', async () => {
  const fallbackRows = [{ stableId: 'us1', mag: 3.9 }];
  const source = createBmkgEarthquakeSource({
    fetchImpl: async () => ({ ok: false, status: 503 }),
    fallbackSource: { async getSnapshot() { return fallbackRows; } },
  });
  assert.equal(await source.getSnapshot(), fallbackRows);
});

test('abort never initiates the fallback source', async () => {
  const ctrl = new AbortController();
  ctrl.abort();
  const source = createBmkgEarthquakeSource({
    fallbackSource: { getSnapshot() { throw new Error('must not run'); } },
  });
  await assert.rejects(source.getSnapshot({ signal: ctrl.signal }), /aborted/i);
});
