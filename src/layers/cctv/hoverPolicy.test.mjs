import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canShowRealSnapshotOnHover, realSnapshotFrameUrl } from './hoverPolicy.js';

test('still camera can supply a genuine snapshot only with configured upstream',()=>{
 assert.equal(canShowRealSnapshotOnHover(null),false);
 assert.equal(canShowRealSnapshotOnHover({feedType:'image',feedConfigured:false}),false);
 assert.equal(canShowRealSnapshotOnHover({feedType:'image',feedConfigured:true}),true);
});
test('video camera requires a separately configured still URL to display hover',()=>{
 assert.equal(canShowRealSnapshotOnHover({feedType:'hls',feedConfigured:true}),false);
 assert.equal(canShowRealSnapshotOnHover({feedType:'hls',feedConfigured:true,snapshotAvailable:true}),true);
 assert.equal(canShowRealSnapshotOnHover({feedType:'mp4',feedConfigured:true,snapshotAvailable:true}),true);
 assert.equal(canShowRealSnapshotOnHover({feedType:'rtmp',feedConfigured:true,snapshotAvailable:false}),false);
});
test('genuine-only snapshot cannot become arbitrary media URL or proxy',()=>{
 assert.equal(realSnapshotFrameUrl('/api/cctv/frame/cam-1?ts=19'),'/api/cctv/frame/cam-1?ts=19&genuine=1');
 assert.equal(realSnapshotFrameUrl('http://camera.local/stream'),null);
 assert.equal(realSnapshotFrameUrl('/api/cctv/media/1'),null);
 assert.equal(realSnapshotFrameUrl('/api/cctv/frame/a?genuine=0'),'/api/cctv/frame/a?genuine=1');
});
