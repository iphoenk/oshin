/** Pure OSHIN globe-overlay validation. No camera stream/media access here. */
export const GLOBE_SOURCE_HOSTS = new Set([
  'cctvnusantara.com',
  'jakcctv.jakarta.go.id',
  'pelindung.bandung.go.id',
  'bsw.kotabogor.go.id',
  'cctv.semarangkota.go.id',
  'pantausemar.semarangkota.go.id',
  'atcs.denpasarkota.go.id',
  'dataset.jogjakota.go.id',
]);

export function validatedSourceUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    if (!GLOBE_SOURCE_HOSTS.has(url.hostname)) return null;
    if (url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function coordinate(value, low, high) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= low &&
    value <= high
  );
}

export function makeGlobeOverlayFeatures(payload) {
  if (
    payload?._schema?.mode !== 'PUBLIC_METADATA_RESEARCH_OVERLAY' ||
    payload?._schema?.no_camera_pins !== true ||
    payload?._schema?.no_streams !== true ||
    !Array.isArray(payload?.hub_markers) ||
    !Array.isArray(payload?.site_candidates)
  ) {
    throw new Error('Unexpected CCTV globe source schema');
  }

  const ids = new Set();
  function feature(raw, mode) {
    const safeUrl = validatedSourceUrl(
      mode === 'hub' ? raw?.url : raw?.source_url,
    );
    if (
      !safeUrl ||
      !coordinate(raw?.lat, -90, 90) ||
      !coordinate(raw?.lon, -180, 180) ||
      typeof raw?.id !== 'string' ||
      !raw.id ||
      ids.has(raw.id) ||
      raw.verified_camera_position !== false ||
      raw.live_playback_verified !== false ||
      (mode === 'hub' && raw.kind !== 'AGGREGATOR_REFERENCE_HUB') ||
      (mode === 'site' &&
        raw.geospatial_type !== 'UNVERIFIED_PUBLIC_AREA_CANDIDATE_NOT_CAMERA')
    ) {
      throw new Error('Invalid or potentially misleading CCTV map reference');
    }
    ids.add(raw.id);
    return {
      id: raw.id,
      mode,
      label: String(mode === 'hub' ? raw.name : raw.label).slice(0, 160),
      area: String(mode === 'hub' ? raw.scope : raw.regency_city).slice(0, 80),
      lat: raw.lat,
      lon: raw.lon,
      url: safeUrl,
      observation: String(mode === 'hub' ? raw.count_note : raw.note).slice(
        0,
        500,
      ),
      claimed:
        mode === 'hub'
          ? (raw.claimed_count ?? null)
          : (raw.claimed_view_count ?? null),
      independentPlaybackConfirmed: false,
      cameraPositionConfirmed: false,
    };
  }
  const hubs = payload.hub_markers.map((raw) => feature(raw, 'hub'));
  const sites = payload.site_candidates.map((raw) => feature(raw, 'site'));
  return { hubs, sites };
}
