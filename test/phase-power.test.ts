import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePower, PowerCalculationMode } from '../lib/power';

test('uses aggregate telemetry for automatic power calculation', () => {
  const result = calculatePower(PowerCalculationMode.AUTO, 201, 32);

  assert.deepEqual(result, {
    power: 6432,
    isComplete: true,
    mode: PowerCalculationMode.AUTO,
  });
});

test('calculates single-phase and split-phase power', () => {
  const singlePhase = calculatePower(PowerCalculationMode.SINGLE_PHASE, 230, 16);
  const splitPhase = calculatePower(PowerCalculationMode.SPLIT_PHASE, 240, 32);

  assert.deepEqual(singlePhase, {
    power: 3680,
    isComplete: true,
    mode: PowerCalculationMode.SINGLE_PHASE,
  });
  assert.deepEqual(splitPhase, {
    power: 7680,
    isComplete: true,
    mode: PowerCalculationMode.SPLIT_PHASE,
  });
});

test('calculates three-phase line-to-line power', () => {
  const result = calculatePower(PowerCalculationMode.THREE_PHASE_LINE_TO_LINE, 223.6, 10.3);

  assert.deepEqual(result, {
    power: 3989.0515738957297,
    isComplete: true,
    mode: PowerCalculationMode.THREE_PHASE_LINE_TO_LINE,
  });
});

test('calculates three-phase line-to-neutral power', () => {
  const result = calculatePower(PowerCalculationMode.THREE_PHASE_LINE_TO_NEUTRAL, 230, 16);

  assert.deepEqual(result, {
    power: 11040,
    isComplete: true,
    mode: PowerCalculationMode.THREE_PHASE_LINE_TO_NEUTRAL,
  });
});

test('accepts zero current readings', () => {
  const result = calculatePower(PowerCalculationMode.SINGLE_PHASE, 230, 0);

  assert.deepEqual(result, {
    power: 0,
    isComplete: true,
    mode: PowerCalculationMode.SINGLE_PHASE,
  });
});

test('rejects missing or invalid aggregate telemetry', () => {
  const missingCurrent = calculatePower(PowerCalculationMode.SPLIT_PHASE, 240, undefined);
  const invalidVoltage = calculatePower(PowerCalculationMode.THREE_PHASE_LINE_TO_NEUTRAL, Number.NaN, 16);

  assert.deepEqual(missingCurrent, { power: 0, isComplete: false, mode: PowerCalculationMode.SPLIT_PHASE });
  assert.deepEqual(invalidVoltage, { power: 0, isComplete: false, mode: PowerCalculationMode.THREE_PHASE_LINE_TO_NEUTRAL });
});
