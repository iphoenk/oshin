# OSHIN · Indonesia-first integration

OSHIN is an Indonesia-first fork of [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view).

## Deployment decisions

- GitHub `iphoenk/oshin` is the source of truth for the fork.
- Keep the pre-existing Vercel `oshin` deployment untouched until a separate
  staging build and browser/API acceptance pass.
- Pinokio on a Windows laptop is for local development and visual comparison.
  It is **not** a production backend.
- Persistent AIS and authorized camera streaming require an appropriate managed
  long-lived service; a static Vercel build alone does not provide it.
- Do not introduce a NUC, Ubuntu home server, or unaudited exposed local proxy.
- Respect the upstream MIT LICENSE, third-party attribution and dataset-specific
  restrictions in `DATA_SOURCES.md` and `THIRD_PARTY_NOTICES.md`.
  Bundled TeleGeography imagery/data have NonCommercial conditions; do not assume
  the entire distribution can be relicensed commercially.

## Indonesia-first roadmap

| Track | Source approach | Validation |
| --- | --- | --- |
| Earthquakes | BMKG official bulletins via same-origin proxy; USGS fallback | Feed origin, event date, coordinates, depth, source |
| Live flights | Existing OpenSky/adsb.lol acquisition | Seen age, receiver coverage, interpolation versus observation |
| Live vessels | Existing AISStream websocket gateway | Key provisioned; last-seen time and stale telemetry; no invented movement |
| Public cameras | Government-published catalogs (DKI, BPJT, ATCS) | Camera metadata, legal access, playback and real-time health separately |
| Power network | OpenInfraMap/OSM public mapped network | Coverage and attribution; never imply operational SSOT |
| Optical fiber | Public operator/Palapa Ring releases + OSM mapped telecom | Do not equate all telecom features with fiber |
| Wildfire hotspots | NASA FIRMS with free MAP key | Satellite detection is not a confirmed fire |

## BMKG integration v0

The independent source adapter is at
`src/layers/earthquakes/bmkg.js`. For browser instances of OSHIN,
`src/sources/reference.js` selects BMKG, with the existing USGS source
as an explicit fallback. Node/unit environments retain the upstream USGS
default for compatibility.

The proxy at `/api/oshin/bmkg` runs through the existing Vite
middleware in `server/providers/indonesia/bmkg.js`.

Official endpoints requested in parallel:

- `https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json`
- `https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json`
- `https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json`

The app only admits valid coordinates and magnitudes; merges duplicates;
keeps the layer's M2.5 display threshold; caches for 120 seconds;
caps upstream bodies and marks partial/unavailable feeds. BMKG bulletins
are not a complete 24-hour event catalog, unlike USGS `all_day`.
User-facing data source labels must distinguish those semantics.

### Local verification

```bash
npm ci
node --test src/layers/earthquakes/bmkg.test.mjs
npm run format:check
npm test
npm run build
npm run dev
```

Run in supported Node 24.14+ or 26.x. Verify
`http://localhost:4173/api/oshin/bmkg` and the Cesium earthquake layer.
Check that returned events have official BMKG timestamps and that a failed
upstream preserves the previous valid layer or falls back to USGS.

## Release gates

Never describe a layer as LIVE solely because its code compiles or an API
returned HTTP 200. Acceptance requires verified data semantics, age,
source/terms, provider uptime, and rendering. Do not use synthetic CCTV
fallback imagery as a substitute for a real live stream.
