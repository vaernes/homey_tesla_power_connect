import { PhaseMeasurement } from './vitals';

export enum PowerCalculationMode {
  AUTO = 'auto',
  AGGREGATE = 'aggregate',
  PHASE_SUM = 'phase_sum',
}

export interface PowerCalculation {
  power: number;
  isComplete: boolean;
  mode: PowerCalculationMode;
}

function isValidMeasurement(voltage: number | undefined, current: number | undefined): boolean {
  return typeof voltage === 'number'
    && typeof current === 'number'
    && Number.isFinite(voltage)
    && Number.isFinite(current)
    && voltage >= 0
    && current >= 0;
}

export function calculatePower(
  mode: PowerCalculationMode,
  gridVoltage: number | undefined,
  vehicleCurrent: number | undefined,
  phaseMeasurements: PhaseMeasurement[],
): PowerCalculation {
  if (mode !== PowerCalculationMode.PHASE_SUM && isValidMeasurement(gridVoltage, vehicleCurrent)) {
    return {
      power: gridVoltage! * vehicleCurrent!,
      isComplete: true,
      mode: PowerCalculationMode.AGGREGATE,
    };
  }

  if (mode === PowerCalculationMode.AGGREGATE) {
    return { power: 0, isComplete: false, mode: PowerCalculationMode.AGGREGATE };
  }

  if (mode === PowerCalculationMode.AUTO) {
    return { power: 0, isComplete: false, mode: PowerCalculationMode.AGGREGATE };
  }

  let power = 0;
  let hasMeasurement = false;

  for (const phase of phaseMeasurements) {
    const { voltage, current } = phase;
    if (voltage === undefined && current === undefined) continue;

    if (
      typeof voltage !== 'number'
      || typeof current !== 'number'
      || !Number.isFinite(voltage)
      || !Number.isFinite(current)
      || voltage < 0
      || current < 0
    ) {
      return { power: 0, isComplete: false, mode: PowerCalculationMode.PHASE_SUM };
    }

    hasMeasurement = true;
    power += voltage * current;
  }

  return { power, isComplete: hasMeasurement, mode: PowerCalculationMode.PHASE_SUM };
}
