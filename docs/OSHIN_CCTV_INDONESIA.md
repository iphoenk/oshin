# OSHIN · CCTV PUBLIC INDONESIA INTAKE · 18 October 2026

This data module aggregates **public governmental CCTV source metadata** in Indonesia into the OSHIN fork. It is not a camera exploitation dataset and is not a comprehensive inventory of all municipalities.

## Inputs

1. Uploaded `cctv_id_registry(1).json` v0.1.0 (14 listed sources; 41 named Tasikmalaya cameras; source claims 45, a 4-camera discrepancy).
2. Prior OSHIN source research: DKI Jakarta public CCTV, Bogor, Banyumas, Denpasar, BPJT, Kediri.
3. User-supplied independent camera leak/insider-misuse threat research: adds public-by-design reference portals in Bandung and Medan, and motivates the privacy gates below. The threat incidents and private footage are **not** imported as camera feeds.
4. Official portal web checks on 2026-10-18: [Jakarta](https://jakcctv.jakarta.go.id/publik), [Bogor City](https://bsw.kotabogor.go.id/cctv), [Bogor Regency](https://itscctv-dishub.bogorkab.go.id/), [Banyumas](https://atcs.banyumaskab.go.id/), [Kediri](https://dishub.kedirikota.go.id/live-streaming-atcs/), [Magelang](https://restreamer.magelangkota.go.id/index.html).

## Artifacts

- `config/oshin/cctv_id_registry.source.json`: byte-for-byte-semantic JSON representation of the user-provided registry. Unverified notes are assertions from the upload, not OSHIN observations.
- `public/oshin/cctv/registry.json`: normalized 22-source registry of portal metadata and 41 named camera records with provenance and permissions.
- `public/oshin/cctv/index.html`: public metadata directory; a shortcut from the application's original root page.
- `src/oshin/cctvRegistry.test.mjs`: validation pins for source IDs, URL schemes, coordinates, and permission gates.

## Critical integrity rules

- A portal or single HLS manifest returning HTTP 200 is **not** proof that every feed is running.
- Uploaded `verified_live` statuses are carried in `claimed_status`; **all** records use `streaming_verification=NOT_VERIFIED_BY_OSHIN` until actual operator-authorized playback verification.
- No invented pins: city_center_approx is NOT a camera position. All 41 named cameras currently have `location=null` and `geolocation_verified=false`. Globe layer should not import such entries as spatial camera points.
- None of these operator portals has yet granted OSHIN an explicit redistribution license. Accordingly `integration_status=METADATA_ONLY` and no live media endpoint is auto-proxied.
- **Banyumas**: the official ATCS page says, *Dilarang mengunduh dan meng-capture video live streaming yang ada di website ini.* OSHIN only links out; do not download/capture/redistribute this media.
- `robots_blocked` is a discovery barrier, not permission to circumvent robots restrictions using another proxy.
- No brute-force, Shodan-wide sweeps, leaked credentials, private camera feeds, passwordless device indexes, or endpoint guessing.
- Claims about breach/compromise from social media or threat reporting are not verified facts.

## Privacy / threat report (non-operational)

The user-supplied research found four Indonesia cases described in public reporting: Starbucks Sunter (2020, insider misuse), a 2020 Jakarta covert-camera criminal investigation, Pekalongan school covert-camera/leak allegations (2026), and a **disputed, unconfirmed** Medan municipal CCTV compromise claim (2026). Do not collect or publish private footage, victim identities, IP addresses, tokens, or direct links to leaked materials. Even deliberately public government camera viewing is **not** evidence of a security breach, and does not grant recording rights.

Relevant legal and operational sources include:

- Indonesia [Personal Data Protection Act (UU 27/2022)](https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022)
- [ITE Amendment 2024](https://peraturan.bpk.go.id/Details/274494/uu-no-1-tahun-2024)
- [Sexual Violence Law (UU 12/2022)](https://peraturan.bpk.go.id/Details/207944/uu-no-12-tahun-2022)
- [Yogyakarta CCTV recordings application process](https://dinkominfosan.jogjakota.go.id/page/index/prosedur-permintaan-rekaman-cctv-pemerintah-kota-yogyakarta)

## Next phases before enabling a live map layer

1. Obtain explicit operator permissions for embedding, transcoding, proxying and redistributing each live feed.
2. Check the official source for current camera lists; reconcile 45 asserted vs 41 listed Tasikmalaya.
3. Verify per-camera geographic coordinates and publication intent via trusted operator location metadata.
4. Test each authorized HLS/YouTube/iframe feed independently, with timestamps, playback health, source attribution and sensible throttling.
5. Build integration pack with allowlisted government public origins and isolated proxy. Never silently substitute unrelated synthetic footage.
6. Run CI, functional browser QA and live provider checks before merging or promoting a deployment. Maintain existing Vercel production until then.

**Coverage note:** 22 candidate government/operator portals across a subset of Indonesia, not 22 cities, and nowhere near full national kabupaten/kota coverage. This is an auditable seed registry, not a nationwide completion claim.

## P0 · Jakarta, Malang Raya, Surabaya, Tol (18 Oct 2026)

Four dedicated OSHIN UI filters were added, and P0 sources appear first.
`registry.json` now has 25 operator sources (7 P0) and 41 named Tasikmalaya
cameras from the original upload. Eight distinct verified official Bina Marga
toll-corridor landing links are attached under `binamarga-tol`.

- **DKI**: https://jakcctv.jakarta.go.id/publik — site listing, not individually verified streaming.
- **Kota Malang**: https://cctv.malangkota.go.id/sebaran-cctv — web camera list, not per-camera coordinates. Batu and Kabupaten Malang are pending.
- **Surabaya**: https://surabaya.go.id/id/berita/25117/sits-dan-layanan-digital-terintegrasi-perkuat-transformasi-smart-city-surabaya and official SITS CCTV Android app. Public traffic monitoring existence does not grant rights to extract a proprietary API. Dishub footage-access policy: https://dishub.surabaya.go.id/portal/post/20250829131456
- **Tol**: https://bpjt.pu.go.id/cctv/ and https://binamarga.pu.go.id/contents/cctv_tol (8 exact corridor deep links). Official BPJT FAQ https://bpjt.pu.go.id/faq/apakah-data-cctv-tersedia-di-bpjt/ permits public realtime *viewing*, not republishing or archive access.

All records are metadata-only until per-feed permission, coordinates,
and live data are independently verified. No unapproved stream proxy.

## Mandatory national coverage master (all cities + regencies)

The `public/oshin/cctv/regions.json` master has **every second-tier
administrative region** from normalized [Kepmendagri No.
300.2.2-2138/2025](https://peraturan.bpk.go.id/Details/322942/keputusan-mendagri-no-nomor-30022-2138-tahun)
data maintained at
[awanaprilino/wilayah-administrasi-kemendagri](https://github.com/awanaprilino/wilayah-administrasi-kemendagri).

- **38 provinces, 514 kabupaten/kota, 98 cities (93 autonomous + 5 Jakarta
  administrative cities), 416 regencies**.
- Data recorded in place as a full research **coverage register**, not
  a claim that all have publicly accessible CCTV.
- 11 cities have one or more **direct portal source candidates**;
  5 Jakarta administrative cities have only an **unassigned DKI province-level
  portal candidate**. The remaining 82 cities are explicitly
  `NO_SOURCE_MAPPED` (research pending).
- Kabupaten are also fully listed with direct sources where matched,
  and otherwise marked as discovery backlog.
- National/toll source lists cannot be assigned to every city solely
  because a highway crosses its jurisdiction. Geo-assignment requires
  official camera or route coordinates.
- A missing source is not evidence of no CCTV; a government public portal
  is not evidence of stream availability, camera placement or authorization.
- No live cameras nor coordinates are marked verified in the master.
- UI route: `/oshin/cctv/regions.html`, with searchable/sortable
  source candidates, province filtering, city/regency switch, source links.
  The homepage remains `/oshin/cctv/` with a prominent link.

Progress must increment only with evidence:
`NO_SOURCE_MAPPED` -> `SOURCE_CANDIDATE` ->
operator-verified camera metadata -> individually validated playback ->
confirmed rights and operational readiness. Do not skip steps.

## Expanded official-source discovery · 19 October 2026

Twelve additional, explicitly identified public government/operator
sources have been added, taking the source registry from **25 to 37**.
The 514-region master has **22 cities** with one or more directly matched
candidates, **5 DKI administrative cities** with the provincial portal
candidate only, and **71 cities** with no matched public portal *yet*.

| Jurisdiction | Official public evidence | What it proves |
| --- | --- | --- |
| Banda Aceh | https://cctv.bandaacehkota.go.id/ | Municipal CCTV catalog claims 56 cameras, 43 'online' |
| Jambi | https://cctv.jambikota.go.id/ | City public player lists junction camera names |
| Palembang | https://cctv.palembang.go.id/ | City CCTV map says 30 online cameras |
| Pekanbaru | https://cctv-map.pekanbaru.go.id/ and https://cctv-map.pekanbaru.go.id/cctv | **Conflicting counters:** landing claims 70/88 cameras and 41 HLS online, map index says 0; do not promote to operational |
| Banjarmasin | https://atcs.banjarmasinkota.go.id/ | 35 public cameras claimed on official portal |
| Banjar (West Java) | https://atcs.banjarkota.go.id/ | Official live camera selector and named junctions |
| Samarinda | https://samarindakota.go.id/layanan/cctv | 8 public camera choices, official YouTube-based viewing |
| Banjarbaru | https://cctv.banjarbarukota.go.id/ | Official camera location map; exact coordinates unverified |
| Pontianak | https://www.pontianak.go.id/pontianak-hari-ini/berita/Dishub-Pontianak-Tambah-Titik-Lokasi-CCTV | Government explicitly shares 17 individual YouTube CCTV watch links published in Nov 2025 |
| Balikpapan | https://dishub.balikpapan.go.id/halaman/b-connect-balikpapan-connectivity | B-CONNECT mobile CCTV access documented; no open feed established |
| Kendari | https://satudata.kendarikota.go.id/dataset/?organization=diskominfo | Official municipality CCTV XLSX metadata dataset, **not live video** |
| Kabupaten Kotabaru | https://simperhubungan.dishubkotabaru.id/atcs | 3 ATCS junctions / 12 camera units publisher-claimed; portal not live tested |

### Pontianak published YouTube views

17 named watch URLs, as printed in the official 2025 city article, are
recorded in `registry.json` as `public_viewing_url`. Each opens the
YouTube viewing page in a new tab rather than ripping segments or
proxying HLS streams. **No claim the specific broadcasts remain live
as of 2026-10-19.** Embedding also requires separate checks and is
not enabled. Registry's 58 named camera entries comprise 41 Tasikmalaya
HLS metadata plus 17 historical Pontianak YouTube viewing links.

### Source hygiene observations

- Metadata labels `online`, `LIVE`, `24/7`, or an HLS MIME header
  are publisher-side assertions, not independently verified stream health.
- The Pekanbaru GeoPortal and GIS map show contradictory status and totals.
  This is deliberately preserved as an audit flag.
- Private-camera directories, aggregator directories claiming thousands
  of cameras including court waiting rooms, and third-party unauthorized
  restreaming are excluded from OSHIN's official camera registry.
- Court, education, residential and surveillance-control footage have a
  heightened personal-data and consent risk. **Do not assume public view
  constitutes authorization for OSHIN redistribution.**
- Locations listed by a city without verified coordinates remain
  place *names only*. No inferred or city-centre pins appear on the globe.
- Only outbound links to deliberately published government-facing
  information and watch pages have been added.

## Addendum · Padang, Batam and Madiun; Magelang health contradictions

- **Kota Padang:** https://padang.go.id/layanan/stream-cctv officially
  links to https://streamcctv.padang.go.id/ with visible camera-map
  locations. Some camera names refer to health facilities; their publication
  scope must be checked individually to avoid unsafe redistribution.
- **Kota Batam:** https://kominfo.batam.go.id/aplikasidiskominfobatam/
  and https://batam.go.id/aplikasi/ list **Matanya Batam** as an
  official CCTV service, but a public embeddable web stream has not been proven.
- **Kota Madiun:** https://siopa.madiunkota.go.id/cctv currently says
  `Belum Ada CCTV Aktif`; other `madiunkota.go.id` views say the camera
  list failed to load. Keep as an explicit discovered portal with
  **no operational feed accepted**.
- **Kota Magelang:** The official
  https://restreamer.magelangkota.go.id/index.html lists multiple streams
  as LIVE, while https://cctv.magelangkota.go.id/ reports some
  as `Stream offline`; sampled player pages also display
  media-loading errors. Flag as **inconsistent operator health**, not
  proof of live functionality.

After this intake pass: **40 portal/source candidates; 25 cities with
direct portal candidates; 5 DKI administrative city candidates via
province only; 68 cities with no mapped source in OSHIN's index**.
Coverage master still retains **all 514 jurisdictions** and all
live playback verification counters remain 0 until actually tested.

## Follow-up discoveries: Bekasi, Surakarta and Depok

- https://bekasikota.go.id/cctv — a public "Pantau Kota Bekasi"
  viewer/selector. Indexed text says cameras are loading and no stream
  is independently verified.
- https://ccroom-dishub.surakarta.go.id/cctv — Dishub Surakarta
  claims **96 active** CCTV and publishes named camera points.
  Count is a portal claim only, not 96 OSHIN-validated live streams.
- https://dishub.depok.go.id/cctv — official CCTV page shows **0
  online / 0 offline / 0 listed** in the snapshot. This is an
  exposed public viewer with **no confirmed active feeds**, not
  proof Depok has no traffic cameras.
- **Kota Batu:** https://batukota.go.id/Portal/detail_b/3934 officially
  documents ETLE cameras historically; this is *not* a publicly
  available traffic CCTV watching service, so the 514-region
  registry carries it only as a research lead, not a camera source.
- **Kota Tangerang:** https://diskominfo.tangerangkota.go.id/berita/kpk-kunjungi-tangerang-live-room-tinjau-pengelolaan-aduan-dan-layanan-digital-kota-tangerang
  establishes internal CCTV monitoring at Tangerang Live Room but
  not a deliberately published public viewing feed; recorded as
  a research lead only.

Totals: **43 source records** and **514/514 mandatory jurisdictions**.
28 cities have directly matched portal/service candidates, five
DKI cities a provincial-level candidate, 65 city source gaps.
Only manually authorized and individually playback-verified media
may be described as operational/live in OSHIN.

## Gemini audit import · 19 October 2026

Gemini's submitted dataset was **triaged, not copied**. See
`docs/OSHIN_GEMINI_CCTV_IMPORT_AUDIT.md` for accepted official sources,
rejected exposed/unauthorized camera feeds, unverifiable counts,
coordinate-accuracy caveats and Cesium/Vite compatibility.
Six confirmed additional government source records bring OSHIN to
**49 catalog sources**, with **29 directly source-mapped cities**,
5 DKI cities having province-scoped candidate portals and
**64 cities still awaiting discovery**. The master remains **514 regions**.
All new records are metadata-only; no live media or coordinates were
promoted. Jepara operator's attribution and noncommercial restrictions
are retained on the catalog card.

## Gemini research enrichment (internal review purpose, GitHub public!)

User requested broader intake of Gemini data for internal analysis. A
**sanitized, review-only** dataset has been committed under
`config/oshin/cctv_gemini_review.json`. This file is intentionally
**not in `public/`**, is not referenced by the Vite/Cesium runtime,
and is not eligible for CCTV proxying, media playback or operational pins.
**The repository itself is PUBLIC, so this is not a confidential private store.**

The intake retains Gemini's **23 claimed public-road/place area site
groups**, covering **16 claimed Jakarta public-road camera views**, 11
suggested national toll corridor names, four geographic volcano reference
points (explicitly NOT cameras), and 16 safe portal/research leads.
Every coordinate retains an **unverified Gemini submission** flag.
No coordinates can be exported as camera points without operator confirmation.

No Insecam/device exposure paths, private-camera identifiers, raw BaliTower
legacy HTTP/RTMP transport URLs, sensitive interior feeds or open URL
proxy are recorded or activated. Submitted 6,500 / 5,344 total figures
are preserved as unverified *claims*, not dashboard statistics.

### Independently verified addition: Indramayu

The [Pemkab Indramayu Wongreang CCTV portal](https://cctv.indramayukab.go.id/)
shows **35 kamera** with counters **0 online / 0 offline** in web text
during the current research check. Its recordings-request terms restrict
use to relevant emergency/safety incidents and disallow unauthorized
dissemination. Added as source id `indramayu-wongreang-official`,
`METADATA_ONLY`, unverified for current live playback, to registry and
Kabupaten Indramayu's 514-region crosswalk.
