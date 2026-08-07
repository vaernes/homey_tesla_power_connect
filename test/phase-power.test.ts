import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePower, PowerCalculationMode } from '../lib/power';

test('uses aggregate telemetry for the reported US split-phase payload', () => {
  const result = calculatePower(PowerCalculationMode.AUTO, 201, 32, [
    { voltage: 202.4, current: 15.1 },
    { voltage: 202.3, current: 17.1 },
    { voltage: 116, current: 17.4 },
  ]);

  assert.deepEqual(result, {
    power: 6432,
    isComplete: true,
    mode: PowerCalculationMode.AGGREGATE,
  });
});

test('calculates explicit phase-sum power', () => {
  const result = calculatePower(PowerCalculationMode.PHASE_SUM, 230, 16, [
    { voltage: 120, current: 32 },
    { voltage: 120, current: 32 },
    {},
  ]);

  assert.deepEqual(result, {
    power: 7680,
    isComplete: true,
    mode: PowerCalculationMode.PHASE_SUM,
  });
});

test('does not infer phase-sum power when aggregate telemetry is unavailable', () => {
  const result = calculatePower(PowerCalculationMode.AUTO, undefined, undefined, [
    { voltage: 230, current: 16 },
    { voltage: 230, current: 16 },
    { voltage: 230, current: 16 },
  ]);

  assert.deepEqual(result, {
    power: 0,
    isComplete: false,
    mode: PowerCalculationMode.AGGREGATE,
  });
});

test('calculates three-phase charging power', () => {
  const result = calculatePower(PowerCalculationMode.PHASE_SUM, 230, 16, [
    { voltage: 230, current: 16 },
    { voltage: 230, current: 16 },
    { voltage: 230, current: 16 },
  ]);

  assert.deepEqual(result, {
    power: 11040,
    isComplete: true,
    mode: PowerCalculationMode.PHASE_SUM,
  });
});

test('accepts zero current readings', () => {
  const result = calculatePower(PowerCalculationMode.AGGREGATE, 230, 0, [
    { voltage: 230, current: 0 },
    {},
    {},
  ]);

  assert.deepEqual(result, {
    power: 0,
    isComplete: true,
    mode: PowerCalculationMode.AGGREGATE,
  });
});

test('rejects missing or invalid phase values without estimating power', () => {
  const missingCurrent = calculatePower(PowerCalculationMode.PHASE_SUM, 230, 16, [
    { voltage: 230, current: 16 },
    { voltage: 230 },
    {},
  ]);
  const noMeasurements = calculatePower(PowerCalculationMode.PHASE_SUM, 230, 16, [{}, {}, {}]);
  const invalidVoltage = calculatePower(PowerCalculationMode.PHASE_SUM, 230, 16, [
    { voltage: Number.NaN, current: 16 },
    {},
    {},
  ]);

  assert.deepEqual(missingCurrent, { power: 0, isComplete: false, mode: PowerCalculationMode.PHASE_SUM });
  assert.deepEqual(noMeasurements, { power: 0, isComplete: false, mode: PowerCalculationMode.PHASE_SUM });
  assert.deepEqual(invalidVoltage, { power: 0, isComplete: false, mode: PowerCalculationMode.PHASE_SUM });
});
