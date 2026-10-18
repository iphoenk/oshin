const dom = {
  search: document.querySelector('#search'),
  province: document.querySelector('#province'),
  status: document.querySelector('#status'),
  list: document.querySelector('#list'),
  metrics: document.querySelector('#metrics'),
  notice: document.querySelector('#notice'),
};
let registry;

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content != null) node.textContent = String(content);
  return node;
}

function officialLink(source) {
  if (typeof source.portal_url !== 'string') return null;
  let url;
  try {
    url = new URL(source.portal_url);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const link = element('a', 'link', 'Buka portal resmi ↗');
  link.href = url.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

function cameraPanel(cameras) {
  const details = element('details', 'camera-details');
  const summary = element('summary', '', cameras.length + ' kamera terdaftar · lokasi presisi belum tersedia');
  details.append(summary);
  const list = element('ul', 'camera-list');
  for (const camera of cameras) {
    const item = element('li');
    item.append(element('span', '', camera.label));
    item.append(element('span', 'camera-type', camera.camera_type || '—'));
    list.append(item);
  }
  details.append(list);
  return details;
}

function sourceCard(source) {
  const card = element('article', 'source');
  const head = element('div', 'source-head');
  const title = element('div');
  title.append(element('h3', '', source.operator));
  title.append(element('div', 'small muted', [source.regency_city, source.province].filter(Boolean).join(' · ')));
  head.append(title, element('span', 'pill', source.integration_status.replaceAll('_', ' ')));
  card.append(head);
  const body = element('div', 'source-content');
  body.append(element('div', 'small muted', [source.declared_stream_format, source.category, source.provenance].filter(Boolean).join(' · ')));
  if (source.research_observation) body.append(element('p', 'small', source.research_observation));
  const permission = source.no_capture_download
    ? 'DILARANG download/capture oleh operator; hanya tautan.'
    : 'Izin embed/rebroadcast belum dikonfirmasi; hanya tautan.';
  body.append(element('p', 'small muted', permission));
  const link = officialLink(source);
  if (link) body.append(link);
  if (source.cameras.length) body.append(cameraPanel(source.cameras));
  card.append(body);
  return card;
}

function metric(value, label) {
  const node = element('div', 'metric');
  node.append(element('span', 'big', value));
  node.append(element('span', 'desc', label));
  return node;
}

function render() {
  if (!registry) return;
  const search = dom.search.value.trim().toLocaleLowerCase('id-ID');
  const province = dom.province.value;
  const status = dom.status.value;
  const matched = registry.sources.filter((source) => {
    if (province && source.province !== province) return false;
    if (status && source.integration_status !== status) return false;
    if (!search) return true;
    const indexed = [
      source.operator, source.province, source.regency_city,
      source.category, source.portal_url,
      ...source.cameras.map((camera) => camera.label),
    ].join(' ').toLocaleLowerCase('id-ID');
    return indexed.includes(search);
  });
  dom.list.replaceChildren(...matched.map(sourceCard));
  dom.notice.textContent = matched.length + ' dari ' + registry.sources.length +
    ' sumber · setiap stream tetap memerlukan verifikasi playback dan izin penggunaan.';
}

async function load() {
  try {
    const response = await fetch('./registry.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const payload = await response.json();
    if (!Array.isArray(payload.sources)) throw new Error('Registry tidak valid');
    registry = payload;
    dom.metrics.replaceChildren(
      metric(registry.statistics.sources, 'Sumber publik / kandidat'),
      metric(registry.statistics.unique_named_cameras, 'Kamera terdaftar dari berkas'),
      metric(registry.statistics.camera_coordinates_verified, 'Koordinat kamera terverifikasi'),
      metric(registry.statistics.playback_verified_by_oshin, 'Stream diverifikasi OSHIN'),
    );
    const provinces = [...new Set(registry.sources.map((s) => s.province).filter(Boolean))].sort();
    for (const province of provinces) {
      const option = element('option', '', province);
      option.value = province;
      dom.province.append(option);
    }
    for (const control of [dom.search, dom.province, dom.status]) control.addEventListener('input', render);
    render();
  } catch (error) {
    dom.notice.textContent = 'Gagal membaca katalog: ' + error.message;
  }
}

load();
