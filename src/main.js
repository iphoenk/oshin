import { createStandaloneApplication } from './standalone/application.js';
import { describeError } from './standalone/errors.js';
import { t } from './i18n/index.js';

const application = createStandaloneApplication({
  googleApiKey: import.meta.env.GOOGLE_MAPS_API_KEY,
  cesiumToken: import.meta.env.CESIUM_ION_TOKEN,
  allowQaRegistration: import.meta.env.DEV,
});

const started = application.start();
started.then(async ({ scene }) => {
  try {
    const { installOshinCctvGlobe } = await import('./oshin/cctvGlobe.js');
    const disposeCctvGlobe = await installOshinCctvGlobe({ viewer: scene.viewer });
    const unsubscribe = application.subscribe((state) => {
      if (state.status === 'destroying' || state.status === 'destroyed') {
        unsubscribe();
        disposeCctvGlobe();
      }
    });
  } catch (error) {
    // The experimental source-reference layer must not break the core globe.
    console.warn('[OSHIN CCTV Globe] Optional overlay unavailable:', error);
  }
});
started.catch((error) => {
  console.error("God's Eye View initialization failed:", error);
  const loaderStatus = document.querySelector('#loading-screen .loader-status');
  loaderStatus.textContent = t('Error: {message}', {
    message: describeError(error),
  });
  loaderStatus.style.color = '#ff4444';
});

export { application };
