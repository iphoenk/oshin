
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const intake=JSON.parse(readFileSync(new URL('../../config/oshin/cctv_gemini_review.json',import.meta.url),'utf8'));
const registry=JSON.parse(readFileSync(new URL('../../public/oshin/cctv/registry.json',import.meta.url),'utf8'));
const regions=JSON.parse(readFileSync(new URL('../../public/oshin/cctv/regions.json',import.meta.url),'utf8'));

test('Gemini intake is nonoperational and does not overwrite 514-region master',()=>{
 assert.equal(intake._schema.production_usage,'DO_NOT_LOAD_IN_CCTV_PROXY_OR_MAP_LAYER');
 assert.equal(intake._schema.repository_visibility,'PUBLIC');
 assert.equal(regions.regions.length,514);
 assert.equal(registry.sources.length,50);
 assert.equal(intake.stats.authorized_playback_feeds,0);
 assert.equal(intake.stats.actual_verified_camera_coordinates,0);
});
test('Gemini area site claims never masquerade as camera pins',()=>{
 const sites=intake.submitted_street_and_public_area_site_candidates;
 assert.equal(sites.length,23);
 const unique=new Set();
 for(const s of sites){
  assert.ok(!unique.has(s.id));
  unique.add(s.id);
  assert.equal(s.geometry_usage,'DO_NOT_RENDER_AS_CAMERA_PIN');
  assert.equal(s.verification_status,'NEEDS_OPERATOR_LOCATION_CONFIRMATION');
  assert.equal(s.playback_status,'NOT_VERIFIED');
  assert.equal(s.streaming_rights,'NOT_ASSESSED');
  if(s.submitted_location){
   assert.ok(Number.isFinite(s.submitted_location.lat));
   assert.ok(Number.isFinite(s.submitted_location.lon));
  }
 }
 assert.equal(sites.filter(s=>s.province==='DKI Jakarta').reduce((n,s)=>n+(s.camera_count_or_views_claimed||0),0),16);
});
test('No exposed private feeds or unlicensed HLS transport paths in review metadata',()=>{
 const raw=JSON.stringify(intake);
 for(const forbidden of ['insecam.org','cctv.balitower.co.id','rtmp://','103.151.20.87','exposed_ip_cam'])
  assert.ok(!raw.includes(forbidden));
 assert.ok(intake.excluded_sensitive_inputs.length>=3);
});
test('Official Indramayu site is linked but not treated as operational CCTV',()=>{
 const id='indramayu-wongreang-official';
 const s=registry.sources.find(row=>row.id===id);
 assert.ok(s);
 assert.equal(s.declared_camera_count,35);
 assert.equal(s.streaming_verification,'NOT_VERIFIED_BY_OSHIN');
 assert.equal(s.embedding_permission,'UNKNOWN');
 assert.equal(s.integration_status,'METADATA_ONLY');
 const place=regions.regions.find(r=>r.name==='Kabupaten Indramayu');
 assert.ok(place.direct_source_ids.includes(id));
});
