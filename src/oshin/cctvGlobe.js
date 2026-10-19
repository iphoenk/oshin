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
export async function installOshinCctvGlobe({
  viewer,
  fetchImpl = fetch,
  signal,
} = {}) {
  if (!viewer?.dataSources || !viewer?.scene || !viewer?.camera) {
    throw new TypeError('Cesium viewer required');
  }
  const response = await fetchImpl('/oshin/cctv/globe-hubs.json', {
    cache: 'no-store',
    signal,
  });
  if (!response.ok)
    throw new Error('CCTV globe metadata HTTP ' + response.status);
  const features = makeGlobeOverlayFeatures(await response.json());
  if (signal?.aborted) return () => {};

  const source = new Cesium.CustomDataSource(
    'OSHIN · CCTV source and research references',
  );
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
      position: Cesium.Cartesian3.fromDegrees(
        feature.lon,
        feature.lat,
        hub ? 4000 : 2000,
      ),
      point: {
        pixelSize: hub ? 15 : 9,
        color: palette[feature.mode],
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
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
  // i18n-ignore: specialist OSHIN research control label
  toggle.setAttribute(
    'aria-label',
    'Buka kontrol CCTV sumber dan riset di globe', // i18n-ignore: specialist OSHIN control label
  );
  const panel = node('aside');
  panel.id = 'oshin-cctv-globe-panel';
  panel.hidden = true;
  // i18n-ignore: specialist OSHIN source category label
  panel.setAttribute('aria-label', 'CCTV sumber geografis Indonesia');
  const head = node('div', 'cg-head');
  const heading = node('h2', '', 'CCTV 5K+ · Globe Sources');
  const close = node('button', 'cg-close', '×');
  close.type = 'button';
  // i18n-ignore: specialist OSHIN source control label
  close.setAttribute('aria-label', 'Tutup panel CCTV globe');
  head.append(heading, close);
  panel.append(
    head,
    node(
      'p',
      'cg-sub',
      'Layer aktif: hub katalog, bukan 5.344 pin kamera. Titik lokasi oranye hanya kandidat penelitian dan belum terbukti live.',
    ),
  );
  const tabs = node('div', 'cg-tabs');
  const hubsButton = node('button', '', features.hubs.length + ' hub sumber');
  const sitesButton = node(
    'button',
    '',
    features.sites.length + ' lokasi usulan',
  );
  for (const item of [hubsButton, sitesButton]) item.type = 'button';
  tabs.append(hubsButton, sitesButton);
  panel.append(tabs);
  const actions = node('div', 'cg-actions');
  const focus = node('button', '', 'Fokus Indonesia');
  focus.type = 'button';
  const visibility = node('button', '', 'Sembunyikan titik');
  visibility.type = 'button';
  visibility.setAttribute('aria-pressed', 'true');
  actions.append(focus, visibility);
  panel.append(actions);
  const list = node('div', 'cg-list');
  panel.append(list);
  const details = node('div', 'cg-details');
  panel.append(details);
  const footer = node(
    'p',
    'cg-footer',
    'Klaim agregator: 5.344 (Gemini), indeks sumber: 5.078. Kamera individual terverifikasi pada layer ini: 0. ',
  );
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
    details.append(
      node(
        'p',
        '',
        feature.mode === 'hub'
          ? 'Hub direktori publik, bukan CCTV fisik.'
          : 'Titik area publik usulan Gemini, bukan lokasi kamera terverifikasi.',
      ),
    );
    details.append(node('p', '', feature.observation));
    if (feature.claimed != null)
      details.append(
        node(
          'p',
          '',
          'Klaim jumlah sumber: ' +
            feature.claimed +
            ' (belum diverifikasi OSHIN)',
        ),
      );
    const link = node('a', '', 'Buka portal sumber ↗');
    link.href = feature.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    details.append(link);
  }
  function setMode(next) {
    mode = next === 'site' ? 'site' : 'hub';
    clearHoverReference();
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
            mode === 'hub' && feature.id === 'national'
              ? 6000000
              : mode === 'hub'
                ? 200000
                : 25000,
          ),
          duration: 1.3,
        });
      });
      list.append(row);
    }
    details.replaceChildren(
      node(
        'p',
        '',
        mode === 'hub'
          ? 'Pilih hub untuk membuka portal sumber; angka regional bukan hasil audit live.'
          : 'Pilih lokasi publik usulan. Koordinat belum diperiksa terhadap posisi kamera aktual.',
      ),
    );
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
  visibility.addEventListener('click', () => {
    enabled = !enabled;
    if (!enabled) clearHoverReference();
    source.show = enabled;
    visibility.textContent = enabled ? 'Sembunyikan titik' : 'Tampilkan titik'; // i18n-ignore: specialist research toggle
    visibility.setAttribute('aria-pressed', String(enabled));
    if (enabled) setMode(mode);
    requestFrame();
  });
  focus.addEventListener('click', () =>
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(118.0149, -2.5489, 6500000),
      duration: 1.5,
    }),
  );
  // These markers are source references, NOT verified physical camera points.
  // Never load video/snapshot media from an unverified research location.
  const hoverBubble = node('div', 'cg-hover-reference');
  hoverBubble.id = 'oshin-cctv-globe-hover';
  hoverBubble.hidden = true;
  hoverBubble.setAttribute('role', 'status');
  document.body.append(hoverBubble);
  let hoveredReferenceId = null;
  let lastHoverPick = 0;
  function clearHoverReference() {
    hoveredReferenceId = null;
    hoverBubble.hidden = true;
  }
  function hoverReferenceAt(position) {
    if (!enabled || viewer.isDestroyed() || !position) {
      clearHoverReference();
      return;
    }
    const now = Date.now();
    if (now - lastHoverPick < 130) return;
    lastHoverPick = now;
    let picked;
    try {
      picked = viewer.scene.pick(position);
    } catch {
      clearHoverReference();
      return;
    }
    const feature = entityIndex.get(picked?.id?.id);
    if (!feature || feature.mode !== mode) {
      clearHoverReference();
      return;
    }
    if (hoveredReferenceId !== feature.id) {
      hoveredReferenceId = feature.id;
      hoverBubble.replaceChildren(
        node('strong', '', feature.label),
        node('span', '', 'Snapshot belum tersedia · lokasi/sumber belum terverifikasi sebagai kamera live.'),
      );
    }
    hoverBubble.hidden = false;
    hoverBubble.style.left =
      Math.min(window.innerWidth - 285, Math.max(8, position.x + 16)) + 'px';
    hoverBubble.style.top =
      Math.min(window.innerHeight - 85, Math.max(8, position.y + 16)) + 'px';
  }
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
  handler.setInputAction((movement) => {
    if (!enabled || viewer.isDestroyed()) return;
    const picked = viewer.scene.pick(movement.position);
    const id = picked?.id?.id;
    const feature = entityIndex.get(id);
    if (feature && feature.mode === mode) {
      if (panel.hidden) togglePanel();
      showDetails(feature);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  handler.setInputAction(
    (movement) => hoverReferenceAt(movement?.endPosition),
    Cesium.ScreenSpaceEventType.MOUSE_MOVE,
  );
  setMode('hub');
  requestFrame();

  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    handler.destroy();
    clearHoverReference();
    hoverBubble.remove();
    toggle.remove();
    panel.remove();
    if (!viewer.isDestroyed()) viewer.dataSources.remove(source, true);
  };
}
