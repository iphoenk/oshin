import * as Cesium from 'cesium';
import { flyToPreset } from '../camera.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function coord(n, positive, negative) {
  return `${Math.abs(n).toFixed(3)}°${n < 0 ? negative : positive}`;
}

/** A visual command bar over the existing Cesium engine; no replacement globe. */
export function installPhoneXConsole(viewer) {
  if (!viewer?.camera || !viewer?.scene?.postRender)
    throw new TypeError('PHONE-X needs the real Cesium viewer');
  if (document.querySelector('#oshin-phonex-console')) return () => {};

  const title = document.querySelector('#title-bar h1 > span[translate="no"]');
  const subtitle = document.querySelector('#title-bar .subtitle');
  const originalTitle = title?.innerHTML;
  const originalSubtitle = subtitle?.textContent;
  if (title) {
    title.replaceChildren(
      el('span', 'px-name', 'OSHIN'),
      el('span', 'title-accent px-suffix', 'PHONE-X'),
    );
  }
  if (subtitle) subtitle.textContent = "GOD'S EYE VIEW / CESIUM";

  const nav = el('nav', 'px-console');
  nav.id = 'oshin-phonex-console';
  nav.setAttribute('aria-label', 'Phone-X spatial operations');
  const heading = el('div', 'px-heading');
  heading.append(el('span', '', 'SPATIAL OPERATIONS'), el('span', 'px-engine', '● CESIUM 3D'));
  const links = el('div', 'px-links');
  const home = el('button', 'px-action px-home', '⌖ INDONESIA');
  home.type = 'button';
  home.title = 'Return to Indonesia on the Cesium globe';
  home.addEventListener('click', () => {
    viewer.camera.cancelFlight();
    flyToPreset(viewer, 'indonesia', 3);
  });
  const cctv = el('a', 'px-action', '◉ CCTV');
  cctv.href = '/oshin/cctv/';
  const areas = el('a', 'px-action', '▦ 514 REGIONS');
  areas.href = '/oshin/cctv/regions.html';
  links.append(home, cctv, areas);

  const view = el('div', 'px-view');
  const value = el('span', 'px-coordinates', '—');
  view.append(el('span', 'px-view-label', 'CESIUM CAMERA POSITION'), value);
  nav.append(heading, links, view);
  document.body.append(nav);

  let last = 0;
  const tick = () => {
    const now = Date.now();
    if (now - last < 700) return;
    last = now;
    const p = viewer.camera.positionCartographic;
    if (!p) return;
    const lat = Cesium.Math.toDegrees(p.latitude);
    const lon = Cesium.Math.toDegrees(p.longitude);
    if (![lat, lon, p.height].every(Number.isFinite)) return;
    value.textContent = `${coord(lat,'N','S')} · ${coord(lon,'E','W')} · ${Math.round(p.height/1000).toLocaleString('en-US')} km ALT`;
  };
  viewer.scene.postRender.addEventListener(tick);
  tick();
  return () => {
    viewer.scene.postRender.removeEventListener(tick);
    nav.remove();
    if (title && originalTitle !== undefined) title.innerHTML = originalTitle;
    if (subtitle && originalSubtitle !== undefined) subtitle.textContent = originalSubtitle;
  };
}
