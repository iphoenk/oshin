import { createUsgsEarthquakeSource } from '../layers/earthquakes/source.js';
import { createBmkgEarthquakeSource } from '../layers/earthquakes/bmkg.js';
import { createEcccAirQualitySource } from '../layers/airQuality/source.js';
import { createWfigsPerimeterSource } from '../layers/perimeters/source.js';
import { createBundledCableSource } from '../layers/submarineCables/bundledSource.js';
import { createAdsbGnssSource } from '../layers/gnss/source.js';

/** Construct reference feeds without changing the standalone source contracts. */
export function createReferenceSources() {
  const usgs = createUsgsEarthquakeSource();
  return {
    // On the OSHIN browser, use official Indonesian reports before USGS.
    // Node consumers/tests keep their upstream USGS source by default.
    earthquakes:
      typeof window === 'undefined'
        ? usgs
        : createBmkgEarthquakeSource({ fallbackSource: usgs }),
    'air-quality': createEcccAirQualitySource(),
    'fire-perimeters': createWfigsPerimeterSource(),
    cables: createBundledCableSource(),
    'gnss-integrity': createAdsbGnssSource(),
  };
}
