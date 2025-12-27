import { EVSEState, getEVSEStateFromNumber } from './evsestate';

export class vitals {
  contactor_closed!: boolean;
  vehicle_connected!: boolean;
  session_s!: number;
  grid_v!: number;
  grid_hz!: number;
  vehicle_current_a!: number;
  currentA_a!: number;
  currentB_a!: number;
  currentC_a!: number;
  currentN_a!: number;
  voltageA_v!: number;
  voltageB_v!: number;
  voltageC_v!: number;
  relay_coil_v!: number;
  pcba_temp_c!: number;
  handle_temp_c!: number;
  mcu_temp_c!: number;
  uptime_s!: number;
  input_thermopile_uv!: number;
  prox_v!: number;
  pilot_high_v!: number;
  pilot_low_v!: number;
  session_energy_wh!: number;
  config_status!: number;
  evse_state!: number;
  current_alerts!: string[];
  evse_not_ready_reasons!: number[];

  public constructor(json: any) {
    if (!json) return;
    this.contactor_closed = json.contactor_closed;
    this.vehicle_connected = json.vehicle_connected;
    this.session_s = json.session_s;
    this.grid_v = json.grid_v;
    this.grid_hz = json.grid_hz;
    this.vehicle_current_a = json.vehicle_current_a;
    this.currentA_a = json.currentA_a;
    this.currentB_a = json.currentB_a;
    this.currentC_a = json.currentC_a;
    this.currentN_a = json.currentN_a;
    this.voltageA_v = json.voltageA_v;
    this.voltageB_v = json.voltageB_v;
    this.voltageC_v = json.voltageC_v;
    this.relay_coil_v = json.relay_coil_v;
    this.pcba_temp_c = json.pcba_temp_c;
    this.handle_temp_c = json.handle_temp_c;
    this.mcu_temp_c = json.mcu_temp_c;
    this.uptime_s = json.uptime_s;
    this.input_thermopile_uv = json.input_thermopile_uv;
    this.prox_v = json.prox_v;
    this.pilot_high_v = json.pilot_high_v;
    this.pilot_low_v = json.pilot_low_v;
    this.session_energy_wh = json.session_energy_wh;
    this.config_status = json.config_status;
    this.evse_state = json.evse_state;
    this.current_alerts = json.current_alerts;
    this.evse_not_ready_reasons = json.evse_not_ready_reasons;
  }

  public getEvseNotReadyReasons(): number[] {
    return this.evse_not_ready_reasons || [];
  }

  public getContactorClosed(): boolean {
    return !!this.contactor_closed;
  }

  public getVehicleConnected(): boolean {
    return !!this.vehicle_connected;
  }

  public getSessionS(): number {
    return this.session_s || 0;
  }

  public getGridV(): number {
    return this.grid_v || 0;
  }

  public getGridHz(): number {
    return this.grid_hz || 0;
  }

  public getVehicleCurrentA(): number {
    return this.vehicle_current_a || 0;
  }

  public getCurrentA_a(): number {
    return this.currentA_a || 0;
  }

  public getCurrentB_a(): number {
    return this.currentB_a || 0;
  }

  public getCurrentC_a(): number {
    return this.currentC_a || 0;
  }

  public getCurrentN_a(): number {
    return this.currentN_a || 0;
  }

  public getVoltageA_v(): number {
    return this.voltageA_v || 0;
  }

  public getVoltageB_v(): number {
    return this.voltageB_v || 0;
  }

  public getVoltageC_v(): number {
    return this.voltageC_v || 0;
  }

  public getRelayCoilV(): number {
    return this.relay_coil_v || 0;
  }

  public getPcbaTempC(): number {
    return this.pcba_temp_c || 0;
  }

  public getHandleTempC(): number {
    return this.handle_temp_c || 0;
  }

  public getMcuTempC(): number {
    return this.mcu_temp_c || 0;
  }

  public getUptimeS(): number {
    return this.uptime_s || 0;
  }

  public getInputThermopileUV(): number {
    return this.input_thermopile_uv || 0;
  }

  public getProxV(): number {
    return this.prox_v || 0;
  }

  public getPilotHighV(): number {
    return this.pilot_high_v || 0;
  }

  public getPilotLowV(): number {
    return this.pilot_low_v || 0;
  }

  public getSessionEnergyWh(): number {
    return this.session_energy_wh || 0;
  }

  public getConfigStatus(): number {
    return this.config_status || 0;
  }

  public getEvseState(): number {
    return this.evse_state || 0;
  }

  public getEvseStateV2(): EVSEState | undefined {
    if (this.evse_state === undefined) {
      return undefined;
    }
    return getEVSEStateFromNumber(this.evse_state);
  }

  public getCurrentAlerts(): string[] {
    return this.current_alerts || [];
  }
}
