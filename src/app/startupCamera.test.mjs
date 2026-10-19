import test from 'node:test';
import assert from 'node:assert/strict';
import { flyToAustin, flyToIndonesia, CAMERA_PRESETS } from '../camera.js';
import * as Cesium from 'cesium';

test('teardown before the initial camera delay prevents a late flight', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let flights = 0;
  let cancelled = 0;
  const stop = flyToAustin({
    isDestroyed: () => false,
    camera: {
      setView() {},
      flyTo() {
        flights++;
      },
      cancelFlight() {
        cancelled++;
      },
    },
  });
  stop();
  t.mock.timers.tick(1000);
  assert.equal(flights, 0);
  assert.equal(cancelled, 1);
});

test('OSHIN default arrival overlooks Indonesia without erasing existing Austin preset', () => {
  const carto = Cesium.Cartographic.fromCartesian(CAMERA_PRESETS.indonesia.destination);
  const longitude = Cesium.Math.toDegrees(carto.longitude);
  const latitude = Cesium.Math.toDegrees(carto.latitude);
  assert.ok(Math.abs(longitude - 118) < 0.001, longitude);
  assert.ok(Math.abs(latitude + 2.55) < 0.001, latitude);
  assert.ok(carto.height > 7_000_000);
  assert.ok(CAMERA_PRESETS.austin);
});

test('Indonesia intro can be cancelled before its delayed flight', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let flights = 0;
  let cancelled = 0;
  let setViewCalls = 0;
  const stop = flyToIndonesia({
    isDestroyed: () => false,
    camera: {
      setView() { setViewCalls++; },
      flyTo() { flights++; },
      cancelFlight() { cancelled++; },
    },
  });
  assert.equal(setViewCalls, 1);
  stop();
  t.mock.timers.tick(1000);
  assert.equal(flights, 0);
  assert.equal(cancelled, 1);
});

test('Indonesia intro starts only one overview flight after the wait', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let flight = null;
  const stop = flyToIndonesia({
    isDestroyed: () => false,
    camera: {
      setView() {},
      flyTo(options) { flight = options; },
      cancelFlight() {},
    },
  });
  t.mock.timers.tick(500);
  assert.equal(flight.destination, CAMERA_PRESETS.indonesia.destination);
  assert.equal(flight.duration, 4.0);
  stop();
});
