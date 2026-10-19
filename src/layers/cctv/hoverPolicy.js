/** Only a real upstream frame can be displayed as a last CCTV snapshot. */
export function canShowRealSnapshotOnHover(camera) {
  if (!camera || !camera.feedConfigured) return false;
  const kind = String(camera.feedType || '').trim().toLowerCase();
  if (['hls', 'rtmp', 'video', 'mp4', 'mjpeg', 'dash'].includes(kind))
    return camera.snapshotAvailable === true;
  return true;
}

/** Internal same-origin backend route, never an arbitrary media URL. */
export function realSnapshotFrameUrl(frameUrl) {
  if (typeof frameUrl !== 'string' || !frameUrl.startsWith('/api/cctv/frame/'))
    return null;
  const url = new URL(frameUrl, 'https://oshin.internal.invalid');
  url.searchParams.set('genuine', '1');
  return url.pathname + url.search;
}
