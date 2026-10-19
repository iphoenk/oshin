import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const dir=JSON.parse(readFileSync(new URL('../../public/oshin/cctv/aggregator-observations.json',import.meta.url),'utf8'));
const reg=JSON.parse(readFileSync(new URL('../../public/oshin/cctv/registry.json',import.meta.url),'utf8'));
const coverage=JSON.parse(readFileSync(new URL('../../public/oshin/cctv/regions.json',import.meta.url),'utf8'));

test('Aggregator directory is visible as an external link without claiming 5344 playback',()=>{
 assert.equal(dir._schema.representation,'AGGREGATOR_PORTAL_NAVIGATION_ONLY');
 assert.equal(dir._schema.viewer_mode,'OPEN_IN_SOURCE_SITE_ONLY');
 assert.equal(dir.acceptance.external_browsing_now,true);
 assert.equal(dir.acceptance.native_cesium_camera_pins,false);
 assert.equal(dir.acceptance.native_hls_playback,false);
 assert.equal(dir.directory.individual_camera_records_imported,0);
 assert.equal(dir.directory.live_streams_verified_independently_by_oshin,0);
 assert.equal(dir.counts.find(x=>x.id==='gemini').reported_count,5344);
 assert.equal(dir.counts.find(x=>x.id==='main-current').reported_count,5078);
});

test('Count observations vary and remain assertions, not operational camera identities',()=>{
 const nums=dir.counts.map(x=>x.reported_count);
 assert.ok(new Set(nums).size>1);
 assert.ok(dir.counts.every(x=>x.verification!=='PER_CAMERA_LIVE_VERIFIED'));
 assert.ok(dir.regions_sample.sample_items.every(x=>x.camera_records_in_oshin===0));
 assert.ok(dir.regions_sample.sample_items.every(x=>x.source_url==='https://cctvnusantara.com/'));
 assert.equal(reg.sources.length,50);
 assert.equal(coverage.regions.length,514);
});
test('No private or unauthorized direct camera paths appear in aggregator observations',()=>{
 const raw=JSON.stringify(dir);
 for(const forbidden of ['insecam.org','rtmp://','/camera/private/','cctv.balitower.co.id'])
  assert.ok(!raw.includes(forbidden));
 assert.equal(dir._schema.integration_validation,'NOT_AUTHORIZED_FOR_MEDIA_RELAY');
});
