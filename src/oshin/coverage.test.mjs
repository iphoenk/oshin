import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const coverage=JSON.parse(readFileSync(new URL('../../public/oshin/cctv/regions.json',import.meta.url),'utf8'));
const registry=JSON.parse(readFileSync(new URL('../../public/oshin/cctv/registry.json',import.meta.url),'utf8'));
const sources=new Map(registry.sources.map(s=>[s.id,s]));

test('the full 2025 administrative hierarchy is covered without gaps or duplicate IDs',()=>{
 const r=coverage.regions;
 assert.equal(r.length,514);
 assert.equal(new Set(r.map(x=>x.region_code)).size,514);
 assert.equal(new Set(r.map(x=>x.region_id)).size,514);
 assert.equal(new Set(r.map(x=>x.province_code)).size,38);
 assert.equal(r.filter(x=>x.kind==='CITY_AUTONOMOUS').length,93);
 assert.equal(r.filter(x=>x.kind==='CITY_ADMINISTRATIVE').length,5);
 assert.equal(r.filter(x=>x.kind==='REGENCY').length,416);
 assert.equal(r.filter(x=>x.kind.startsWith('CITY')).length,98);
 assert.ok(r.every(x=>x.required===true));
});

test('every locality source reference points at the existing CCTV registry',()=>{
 for(const row of coverage.regions){
  for(const id of [...row.direct_source_ids,...row.province_portal_source_ids])
   assert.ok(sources.has(id),row.name+' -> '+id);
  assert.equal(row.live_cameras_verified,0);
  assert.equal(row.verified_camera_locations,0);
  assert.equal(row.streaming_permission,'NOT_ASSESSED');
 }
});

test('provincial DKI portals are not described as per-camera verified streams',()=>{
 const dki=coverage.regions.filter(row=>row.kind==='CITY_ADMINISTRATIVE');
 assert.equal(dki.length,5);
 for(const city of dki){
  assert.equal(city.province_code,'31');
  assert.equal(city.direct_source_ids.length,0);
  assert.ok(city.province_portal_source_ids.includes('jakarta-cctv-publik'));
  assert.equal(city.research_status,'PROVINCE_PORTAL_CANDIDATE');
 }
});

test('city research gaps are explicit rather than fabricated feeds',()=>{
 const city=coverage.regions.filter(row=>row.kind.startsWith('CITY'));
 const direct=city.filter(row=>row.direct_source_ids.length).length;
 const coveredProvince=city.filter(row=>row.province_portal_source_ids.length).length;
 const unknown=city.filter(row=>!row.direct_source_ids.length&&!row.province_portal_source_ids.length).length;
 assert.equal(direct,coverage.stats.cities_with_direct_candidate);
 assert.equal(coveredProvince,coverage.stats.cities_with_provincial_candidate);
 assert.equal(unknown,coverage.stats.cities_without_mapped_source);
 assert.equal(coverage.stats.cities,98);
 assert.equal(coverage.stats.regencies,416);
 assert.equal(coverage.stats.provinces,38);
 assert.equal(coverage.stats.verified_live_cameras,0);
});
