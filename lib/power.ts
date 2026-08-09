export enum PowerCalculationMode {
  AUTO = 'auto',
  SINGLE_PHASE = 'single_phase',
  SPLIT_PHASE = 'split_phase',
  THREE_PHASE_LINE_TO_LINE = 'three_phase_230_240',
  THREE_PHASE_LINE_TO_NEUTRAL = 'three_phase_400',
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
  phases?: { voltage?: number; current?: number }[],
): PowerCalculation {
  if (mode === PowerCalculationMode.AUTO && phases && phases.length > 0) {
    let totalPower = 0;
    let hasValidPhase = false;

    for (const phase of phases) {
      if (isValidMeasurement(phase.voltage, phase.current)) {
        totalPower += phase.voltage! * phase.current!;
        hasValidPhase = true;
      }
    }

    if (hasValidPhase) {
      return {
        power: totalPower,
        isComplete: true,
        mode,
      };
    }
  }

  if (!isValidMeasurement(gridVoltage, vehicleCurrent)) {
    return { power: 0, isComplete: false, mode };
  }

  let multiplier = 1;
  if (mode === PowerCalculationMode.THREE_PHASE_LINE_TO_LINE) {
    multiplier = Math.sqrt(3);
  } else if (mode === PowerCalculationMode.THREE_PHASE_LINE_TO_NEUTRAL) {
    multiplier = 3;
  }

  return {
    power: gridVoltage! * vehicleCurrent! * multiplier,
    isComplete: true,
    mode,
  };
}
