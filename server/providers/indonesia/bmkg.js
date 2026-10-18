import { readCappedResponseText } from '../common/http.js';

const ENDPOINT = 'https://data.bmkg.go.id/DataMKG/TEWS/';
const BULLETINS = Object.freeze([
  ['latest', 'autogempa.json'],
  ['major', 'gempaterkini.json'],
  ['felt', 'gempadirasakan.json'],
]);
const TTL_MS = 120_000;
const MAX_BYTES = 512 * 1024;

/** Small same-origin proxy: only fixed official BMKG paths, never user URLs. */
export function bmkgIndonesiaProxy({
  fetchImpl = (...args) => globalThis.fetch(...args),
  now = () => Date.now(),
} = {}) {
  let cached = null;
  let pending = null;

  async function load() {
    const feeds = await Promise.all(
      BULLETINS.map(async ([kind, name]) => {
        try {
          const response = await fetchImpl(ENDPOINT + name, {
            signal: AbortSignal.timeout(10_000),
            headers: { Accept: 'application/json' },
          });
          if (!response.ok) throw new Error('HTTP ' + response.status);
          const { tooLarge, text } = await readCappedResponseText(response, MAX_BYTES);
          if (tooLarge) throw new Error('Payload exceeds limit');
          const payload = JSON.parse(text);
          const raw = payload?.Infogempa?.gempa;
          if (raw == null) throw new Error('Missing earthquake bulletin');
          const gempa = Array.isArray(raw) ? raw : [raw];
          if (!gempa.every((e) => e && typeof e === 'object' && !Array.isArray(e)))
            throw new Error('Invalid earthquake bulletin');
          return { kind, ok: true, gempa };
        } catch {
          return { kind, ok: false, gempa: [] };
        }
      }),
    );
    if (!feeds.some((feed) => feed.ok))
      throw new Error('Official BMKG feeds unavailable');
    return {
      source: 'BMKG Data Terbuka',
      source_url: 'https://data.bmkg.go.id/gempabumi/',
      fetched_at: new Date(now()).toISOString(),
      status: feeds.every((feed) => feed.ok) ? 'ok' : 'partial',
      feeds,
    };
  }

  async function handle(req, res) {
    if (req.method !== 'GET') {
      res.writeHead(405, { Allow: 'GET' });
      res.end();
      return;
    }
    try {
      if (!cached || now() - cached.at >= TTL_MS) {
        pending ||= load().then((value) => {
          cached = { at: now(), value };
          return value;
        }).finally(() => { pending = null; });
        await pending;
      }
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=120',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(JSON.stringify(cached.value));
    } catch {
      res.writeHead(503, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(JSON.stringify({ status: 'unavailable', feeds: [], error: 'BMKG unavailable' }));
    }
  }
  return {
    name: 'oshin-indonesia-bmkg',
    configureServer(server) {
      server.middlewares.use('/api/oshin/bmkg', handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/oshin/bmkg', handle);
    },
  };
}
