# OSHIN · Gemini CCTV proposal triage · 19 Oct 2026

**Do not overwrite** `public/oshin/cctv/regions.json` with Gemini's proposed
`regions` array. OSHIN's file has 514 precise Kemendagri kabupaten/kota rows.
The proposal has grouped multi-city nodes, so replacing it would delete
mandatory coverage. The proposed Next.js/React/Leaflet/HLS component also
does not match this fork's Vite / vanilla JS / Cesium architecture.

## Independent checks and accepted data

Six **official-source catalog records** were imported into `registry.json`,
all `METADATA_ONLY` with no automatic playback:
- [Semarang CCTV Terintegrasi](https://cctv.semarangkota.go.id/integrasi):
  lists overlapping municipal ATCS, city areas, government services,
  pump/sungai groups; 86 OPD and 28 kawasan cannot be added to 52 ATCS as
  unique independently verified streams.
- [Semarang PANTAUSEMAR](https://pantausemar.semarangkota.go.id/dashboard):
  public dashboard filter interface is indexed; 0 streams without filters,
  and research browser got HTTP 403 at site root. No challenge bypass.
- [Grobogan Dishub ATCS](https://dishub.grobogan.go.id/atcs/):
  7 signal junctions / 28 CCTV according to operator;
  [public camera portal](https://cctv.dishub.grobogan.go.id/) has mixed
  LIVE and OFF labels and may apply anti-bot challenges.
- [Jepara SAMUDRA CCTV](https://samudra.jepara.go.id/cctv):
  lists 42 strategic CCTV points. Its own reuse terms require
  **operator credit/logo**, and prohibit monetization or unattributed
  cropping. A public portal is not an unconditional third-party relay right.
- [Kota Yogyakarta Open Data 2025](https://dataset.jogjakota.go.id/dataset/dataset2025-18):
  **182 installed units**, categories 97 roads/intersections, 36 TPS/depo,
  29 public areas, 16 green areas, 4 rivers; no live video count or
  license is asserted.
- [Bandung ARIMBI government documentation](https://opendatabdg.gitbook.io/dokumentasi/produk/pengembangan-portal-data/arimbi):
  public information service and traffic ATCS app views, not an approved
  third-party camera API.

## Excluded, and why

- **Insecam/exposed IP cameras**: internet reachability is not
  publication consent. No camera IP, device vendor, exact position or
  compromised stream is imported.
- **BaliTower raw HTTP HLS and RTMP device paths**: owner authorization,
  current per-camera playback and cross-origin publishing rights unknown;
  raw paths and alleged GPS precision not imported. Mixed-content HTTP on
  HTTPS cannot be solved lawfully by a generic proxy.
- **Gemini's 6,500 aggregators and 5,344 active nodes**: no independently
  reproducible per-feed health or methodological evidence. Not live counts.
- **K3I proposed streaming URL**: yielded 404 at supplied endpoint.
  Official NTMC's network report describes integrated operations, not a
  freely republishable government webcam service.
- **ASDP operations/courts/offices/hospitals and other sensitive facilities**:
  operator homepages and aggregator thumbnails do not establish public-view
  authorization.
- **Unverified camera-point coordinates**: many Gemini coordinates
  represent city centers, compound sites or multiple different cameras.
  A camera may be pinned only from camera-specific location evidence.
- **Suggested `/api/cctv-proxy?url=...`**: an open URL proxy risks SSRF
  and unauthorized redistribution. Never introduce one. Only per-operator
  allowlisted, licensed integration may be considered in future.
- **RTMP in HLS.js**: cannot be decoded as HLS; replacing OSHIN's 3D
  Cesium layer with React + Leaflet would break architectural contracts.

## Remaining acceptance

Obtain camera-level location & status, documented owner/publication intent,
individual live playback and terms of embedding. CI, formatting, browser QA
and deployment remain pending. No camera streams were enabled by this intake.
