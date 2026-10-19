import * as Cesium from 'cesium';
import { makeGlobeOverlayFeatures } from './cctvGlobePolicy.js';
import './cctvGlobe.css';

function node(tag, className, value) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (value != null) item.textContent = String(value);
  return item;
}

/**
 * An optional non-camera SOURCE/RESEARCH overlay on the existing Cesium globe.
 * It never participates in the operational CCTV layer, video proxy, or stream catalog.
 */
export async function installOshinCctvGlobe({ viewer, fetchImpl = fetch, signal } = {}) {
  if (!viewer?.dataSources || !viewer?.scene || !viewer?.camera) {
    throw new TypeError('Cesium viewer required');
  }
  const response = await fetchImpl('/oshin/cctv/globe-hubs.json', {
    cache: 'no-store',
    signal,
  });
  if (!response.ok) throw new Error('CCTV globe metadata HTTP ' + response.status);
  const features = makeGlobeOverlayFeatures(await response.json());
  if (signal?.aborted) return () => {};

  const source = new Cesium.CustomDataSource('OSHIN · CCTV source and research references');
  const entityIndex = new Map();
  const siteEntities = [];
  const palette = {
    hub: Cesium.Color.fromCssColorString('#61e0ff'),
    site: Cesium.Color.fromCssColorString('#ffbf71'),
  };
  for (const feature of [...features.hubs, ...features.sites]) {
    const hub = feature.mode === 'hub';
    const entity = source.entities.add({
      id: 'oshin-reference-' + feature.id,
      name: feature.label,
      show: hub,
      position: Cesium.Cartesian3.fromDegrees(feature.lon, feature.lat, hub ? 4000 : 2000),
      point: {
        pixelSize: hub ? 15 : 9,
        color: palette[feature.mode],
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: hub
        ? {
            text: feature.id === 'national' ? 'CCTV 5K+ · SUMBER' : feature.label,
            font: '600 12px Inter, sans-serif',
            fillColor: palette[feature.mode],
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -23),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 9000000),
          }
        : undefined,
    });
    entityIndex.set(entity.id, feature);
    if (!hub) siteEntities.push(entity);
  }
  await viewer.dataSources.add(source);
  if (signal?.aborted || viewer.isDestroyed()) {
    if (!viewer.isDestroyed()) viewer.dataSources.remove(source, true);
    return () => {};
  }
  const toggle = node('button', '', '◉ CCTV 5K+ · GLOBE');
  toggle.id = 'oshin-cctv-globe-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Buka kontrol CCTV sumber dan riset di globe');
  const panel = node('aside');
  panel.id = 'oshin-cctv-globe-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'CCTV sumber geografis Indonesia');
  const head = node('div', 'cg-head');
  const heading = node('h2', '', 'CCTV 5K+ · Globe Sources');
  const close = node('button', 'cg-close', '×');
  close.type = 'button';
  close.setAttribute('aria-label', 'Tutup panel CCTV globe');
  head.append(heading, close);
  panel.append(
    head,
    node('p', 'cg-sub', 'Layer aktif: hub katalog, bukan 5.344 pin kamera. Titik lokasi oranye hanya kandidat penelitian dan belum terbukti live.'),
  );
  const tabs = node('div', 'cg-tabs');
  const hubsButton = node('button', '', features.hubs.length + ' hub sumber');
  const sitesButton = node('button', '', features.sites.length + ' lokasi usulan');
  for (const item of [hubsButton, sitesButton]) item.type = 'button';
  tabs.append(hubsButton, sitesButton);
  panel.append(tabs);
  const actions = node('div', 'cg-actions');
  const focus = node('button', '', 'Fokus Indonesia');
  focus.type = 'button';
  actions.append(focus);
  panel.append(actions);
  const list = node('div', 'cg-list');
  panel.append(list);
  const details = node('div', 'cg-details');
  panel.append(details);
  const footer = node('p', 'cg-footer', 'Klaim agregator: 5.344 (Gemini), indeks sumber: 5.078. Kamera individual terverifikasi pada layer ini: 0. ');
  const catalogue = node('a', '', 'Buka direktori 5K+ ↗');
  catalogue.href = '/oshin/cctv/aggregators.html';
  footer.append(catalogue);
  panel.append(footer);
  document.body.append(toggle, panel);

  let mode = 'hub';
  let enabled = true;
  function requestFrame() {
    viewer.scene.requestRender?.();
  }
  function showDetails(feature) {
    details.replaceChildren(node('strong', '', feature.label));
    details.append(node('p', '', feature.mode === 'hub'
      ? 'Hub direktori publik, bukan CCTV fisik.'
      : 'Titik area publik usulan Gemini, bukan lokasi kamera terverifikasi.'));
    details.append(node('p', '', feature.observation));
    if (feature.claimed != null) details.append(node('p', '', 'Klaim jumlah sumber: ' + feature.claimed + ' (belum diverifikasi OSHIN)'));
    const link = node('a', '', 'Buka portal sumber ↗');
    link.href = feature.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    details.append(link);
  }
  function setMode(next) {
    mode = next === 'site' ? 'site' : 'hub';
    for (const entity of source.entities.values) {
      const feature = entityIndex.get(entity.id);
      entity.show = enabled && feature?.mode === mode;
    }
    hubsButton.setAttribute('aria-pressed', String(mode === 'hub'));
    sitesButton.setAttribute('aria-pressed', String(mode === 'site'));
    list.replaceChildren();
    for (const feature of mode === 'hub' ? features.hubs : features.sites) {
      const row = node('button', '', feature.label);
      row.type = 'button';
      row.addEventListener('click', () => {
        showDetails(feature);
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            feature.lon,
            feature.lat,
            mode === 'hub' && feature.id === 'national' ? 6000000 : mode === 'hub' ? 200000 : 25000,
          ),
          duration: 1.3,
        });
      });
      list.append(row);
    }
    details.replaceChildren(node('p', '', mode === 'hub'
      ? 'Pilih hub untuk membuka portal sumber; angka regional bukan hasil audit live.'
      : 'Pilih lokasi publik usulan. Koordinat belum diperiksa terhadap posisi kamera aktual.'));
    requestFrame();
  }
  function togglePanel() {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    requestFrame();
  }
  toggle.addEventListener('click', togglePanel);
  close.addEventListener('click', togglePanel);
  hubsButton.addEventListener('click', () => setMode('hub'));
  sitesButton.addEventListener('click', () => setMode('site'));
  focus.addEventListener('click', () => viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(118.0149, -2.5489, 6500000),
    duration: 1.5,
  }));
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
  handler.setInputAction(movement => {
    if (!enabled || viewer.isDestroyed()) return;
    const picked = viewer.scene.pick(movement.position);
    const id = picked?.id?.id;
    const feature = entityIndex.get(id);
    if (feature && feature.mode === mode) {
      if (panel.hidden) togglePanel();
      showDetails(feature);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  setMode('hub');
  requestFrame();

  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    handler.destroy();
    toggle.remove();
    panel.remove();
    if (!viewer.isDestroyed()) viewer.dataSources.remove(source, true);
  };
}
