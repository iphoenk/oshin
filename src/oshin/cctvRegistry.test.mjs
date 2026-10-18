import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const registry = JSON.parse(
  readFileSync(new URL('../../public/oshin/cctv/registry.json', import.meta.url), 'utf8'),
);
const original = JSON.parse(
  readFileSync(new URL('../../config/oshin/cctv_id_registry.source.json', import.meta.url), 'utf8'),
);

test('original upload stays auditable and source count is never inflated', () => {
  assert.equal(original.sources.length, 14);
  assert.equal(original.sources[0].camera_count, 45);
  assert.equal(original.sources[0].cameras.length, 41);
  assert.equal(registry.sources.length, 25);
  assert.equal(registry.statistics.unique_named_cameras, 41);
  assert.equal(registry.statistics.claimed_tasikmalaya_count, 45);
  assert.equal(registry.statistics.listed_tasikmalaya_count, 41);
});

test('all sources have stable unique IDs and legal/public permission defaults', () => {
  const ids = new Set();
  for (const source of registry.sources) {
    assert.ok(source.id);
    assert.ok(!ids.has(source.id));
    ids.add(source.id);
    assert.equal(source.embedding_permission, 'UNKNOWN');
    assert.equal(source.streaming_verification, 'NOT_VERIFIED_BY_OSHIN');
    assert.notEqual(source.integration_status, 'READY');
    if (source.portal_url)
      assert.equal(new URL(source.portal_url).protocol, 'https:');
  }
});

test('no city centre coordinates are misrepresented as camera pins or stream health', () => {
  assert.equal(registry.statistics.camera_coordinates_verified, 0);
  assert.equal(registry.statistics.playback_verified_by_oshin, 0);
  for (const source of registry.sources)
    for (const camera of source.cameras) {
      assert.equal(camera.location, null);
      assert.equal(camera.geolocation_verified, false);
      assert.equal(camera.feed_playback_verified, false);
      assert.equal(camera.redistribution_permission, 'UNKNOWN');
      if (camera.official_feed_url)
        assert.equal(new URL(camera.official_feed_url).protocol, 'https:');
    }
});

test('Banyumas download/capture prohibition is explicitly preserved', () => {
  const source = registry.sources.find((item) => item.id === 'atcs-banyumas');
  assert.equal(source.no_capture_download, true);
  assert.equal(source.redistribution_permission, 'PROHIBITED');
});

test('private-feed and breach allegations are not ingested as stream sources', () => {
  assert.ok(registry.sources.every((item) => !item.id.includes('leak')));
  assert.ok(registry.sources.every((item) => !item.id.includes('insecam')));
  assert.ok(registry.sources.every((item) => !item.id.includes('breach')));
});

test('P0 priority covers DKI Malang Surabaya and tolls without pretending live', () => {
  const sources=registry.sources.filter(item=>item.priority_level==='P0');
  assert.equal(sources.length,7);
  for(const tag of ['P0_DKI','P0_MALANG','P0_SURABAYA','P0_TOL'])
    assert.ok(sources.some(item=>item.priority_tags.includes(tag)),tag);
  assert.equal(registry.sources.find(item=>item.id==='malang-city-cctv').portal_url,'https://cctv.malangkota.go.id/sebaran-cctv');
  assert.equal(registry.sources.find(item=>item.id==='bpjt-tol').portal_url,'https://bpjt.pu.go.id/cctv/');
  for(const item of sources){
    assert.equal(item.embedding_permission,'UNKNOWN');
    assert.equal(item.streaming_verification,'NOT_VERIFIED_BY_OSHIN');
    assert.notEqual(item.integration_status,'READY');
  }
});
test('eight highway pages are official outbound portal links, not media relay URLs', () => {
  const routes=registry.sources.find(item=>item.id==='binamarga-tol').corridor_links;
  assert.equal(routes.length,8);
  for(const route of routes)
    assert.match(route.url,/^https:\/\/binamarga\.pu\.go\.id\/contents\/cctv_tol\/\?id_ruas=[a-z0-9-]+$/);
});
