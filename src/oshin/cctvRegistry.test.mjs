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
  assert.equal(registry.sources.length, 50);
  assert.equal(registry.statistics.unique_named_cameras, 58);
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

test('official source intake adds 12 operators without promoting unverified streams', () => {
 assert.equal(registry.statistics.added_official_sources_2026_10_19,24);
 assert.equal(registry.statistics.pontianak_public_youtube_view_links,17);
 for (const s of registry.sources.filter(x => x.evidence_collected_at === '2026-10-19')) {
   assert.equal(s.embedding_permission,'UNKNOWN');
   assert.equal(s.streaming_verification,'NOT_VERIFIED_BY_OSHIN');
   assert.equal(s.integration_status,'METADATA_ONLY');
   assert.ok(s.evidence_url.startsWith('https://'));
 }
});
test('historical Pontianak watch links are only official YouTube pages and have no playable claims', () => {
 const src = registry.sources.find(s => s.id === 'youtube-pontianak-dishub');
 assert.equal(src.cameras.length,17);
 for (const c of src.cameras) {
  assert.match(c.public_viewing_url,/^https:\/\/www\.youtube\.com\/live\/[A-Za-z0-9_-]{11}$/);
  assert.equal(c.official_feed_url,null);
  assert.equal(c.location,null);
  assert.equal(c.feed_playback_verified,false);
  assert.equal(c.embedding_permission,'UNKNOWN');
 }
});
test('Pekanbaru conflicting operator totals remain flagged, not treated as active', () => {
 const source=registry.sources.find(s=>s.id==='cctv-pekanbaru-map');
 assert.equal(source.claimed_status,'official_claims_inconsistent');
 assert.equal(source.declared_camera_count,null);
 assert.equal(source.streaming_verification,'NOT_VERIFIED_BY_OSHIN');
});

test('Padang Batam Madiun and Magelang do not overstate playback readiness',()=>{
 for (const id of ['cctv-padang','batam-matanya','cctv-madiun-city','magelang-restreamer']){
  const source=registry.sources.find(item=>item.id===id);
  assert.ok(source,id);
  assert.equal(source.streaming_verification,'NOT_VERIFIED_BY_OSHIN');
  assert.equal(source.embedding_permission,'UNKNOWN');
  assert.notEqual(source.integration_status,'READY');
 }
 assert.equal(registry.sources.find(s=>s.id==='cctv-madiun-city').claimed_status,'portal_says_no_active_cameras');
 assert.equal(registry.sources.find(s=>s.id==='magelang-restreamer').claimed_status,'official_stream_status_mixed');
});

test('Depok empty portal and Surakarta 96 publisher-side claims do not imply verified media',()=>{
 const depok=registry.sources.find(s=>s.id==='cctv-depok-dishub');
 const solo=registry.sources.find(s=>s.id==='surakarta-ccroom');
 assert.equal(depok.declared_camera_count,0);
 assert.equal(depok.claimed_status,'official_portal_currently_zero');
 assert.equal(solo.declared_camera_count,96);
 assert.equal(solo.streaming_verification,'NOT_VERIFIED_BY_OSHIN');
 assert.equal(solo.embedding_permission,'UNKNOWN');
});

test('Gemini source intake is restricted to independently checked government portals',()=>{
 const approved=['semarang-integrasi-official','semarang-pantausemar-official','grobogan-atcs-official','jepara-samudra-official','yogyakarta-cctv-open-data','bandung-arimbi-official'];
 assert.equal(registry.statistics.official_source_accepted_from_gemini_audit,6);
 for(const id of approved){
  const s=registry.sources.find(x=>x.id===id);
  assert.ok(s,id);
  assert.equal(s.integration_status,'METADATA_ONLY');
  assert.equal(s.streaming_verification,'NOT_VERIFIED_BY_OSHIN');
  assert.equal(s.embedding_permission,'UNKNOWN');
  assert.equal(s.registered_camera_count,0);
  assert.equal(s.cameras.length,0);
 }
 const raw=JSON.stringify(registry);
 assert.ok(!raw.includes('insecam.org'));
 assert.ok(!raw.includes('rtmp://'));
 assert.ok(!raw.includes('Ancol-001-701002'));
 assert.equal(registry.statistics.camera_coordinates_verified,0);
 assert.equal(registry.statistics.playback_verified_by_oshin,0);
});

test('Gemini research intake adds only verified official Indramayu catalog to production-source registry',()=>{
 const s=registry.sources.find(item=>item.id==='indramayu-wongreang-official');
 assert.ok(s);
 assert.equal(s.declared_camera_count,35);
 assert.equal(s.registered_camera_count,0);
 assert.equal(s.streaming_verification,'NOT_VERIFIED_BY_OSHIN');
 assert.equal(s.embedding_permission,'UNKNOWN');
});
