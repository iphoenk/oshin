import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {makeGlobeOverlayFeatures, validatedSourceUrl} from './cctvGlobePolicy.js';

const data=JSON.parse(readFileSync(new URL('../../public/oshin/cctv/globe-hubs.json',import.meta.url),'utf8'));
const aggregator=JSON.parse(readFileSync(new URL('../../public/oshin/cctv/aggregator-observations.json',import.meta.url),'utf8'));
const registry=JSON.parse(readFileSync(new URL('../../public/oshin/cctv/registry.json',import.meta.url),'utf8'));

test('Non-camera Cesium source hubs and public-area research locations are structurally verified',()=>{
 const result=makeGlobeOverlayFeatures(data);
 assert.equal(result.hubs.length,4);
 assert.equal(result.sites.length,23);
 assert.equal(data._schema.no_camera_pins,true);
 assert.equal(data._schema.no_streams,true);
 assert.equal(data.stats.gemini_claimed_active_nodes,5344);
 assert.equal(data.stats.actual_live_feeds_on_map,0);
 assert.equal(registry.sources.length,50);
 assert.equal(aggregator.counts.find(x=>x.id==='main-current').reported_count,5078);
 for(const s of [...result.hubs,...result.sites]){
  assert.equal(s.cameraPositionConfirmed,false);
  assert.equal(s.independentPlaybackConfirmed,false);
 }
});

test('Every marker is declared as a reference, not an actual camera',()=>{
 for(const hub of data.hub_markers){
  assert.equal(hub.kind,'AGGREGATOR_REFERENCE_HUB');
  assert.equal(hub.verified_camera_position,false);
 }
 for(const site of data.site_candidates){
  assert.equal(site.geospatial_type,'UNVERIFIED_PUBLIC_AREA_CANDIDATE_NOT_CAMERA');
  assert.equal(site.verified_camera_position,false);
  assert.equal(site.live_playback_verified,false);
 }
});

test('Source URLs are tightly scoped and reject exposed or non-https endpoints',()=>{
 assert.equal(validatedSourceUrl('http://cctvnusantara.com/'),null);
 assert.equal(validatedSourceUrl('https://insecam.org/en/view/111'),null);
 assert.equal(validatedSourceUrl('https://127.0.0.1/admin'),null);
 assert.equal(validatedSourceUrl('https://localhost/x'),null);
 assert.equal(validatedSourceUrl('rtmp://example.com:1935/live'),null);
 assert.equal(validatedSourceUrl('https://cctvnusantara.com/'),'https://cctvnusantara.com/');
 assert.throws(()=>makeGlobeOverlayFeatures({...data,site_candidates:[{...data.site_candidates[0],live_playback_verified:true}]}));
});
