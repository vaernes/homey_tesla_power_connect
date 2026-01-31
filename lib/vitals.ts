import { EVSEState, getEVSEStateFromNumber } from './evsestate';

interface VitalsData {
  contactor_closed?: boolean;
  vehicle_connected?: boolean;
  session_s?: number;
  grid_v?: number;
  grid_hz?: number;
  vehicle_current_a?: number;
  currentA_a?: number;
  currentB_a?: number;
  currentC_a?: number;
  currentN_a?: number;
  voltageA_v?: number;
  voltageB_v?: number;
  voltageC_v?: number;
  relay_coil_v?: number;
  pcba_temp_c?: number;
  handle_temp_c?: number;
  mcu_temp_c?: number;
  uptime_s?: number;
  input_thermopile_uv?: number;
  prox_v?: number;
  pilot_high_v?: number;
  pilot_low_v?: number;
  session_energy_wh?: number;
  config_status?: number;
  evse_state?: number;
  current_alerts?: string[];
  evse_not_ready_reasons?: number[];
}

export class TWCVitals {
  private readonly data: VitalsData;
  public readonly vehicle_connected: boolean;

  public constructor(json: any) {
    this.data = json || {};
    this.vehicle_connected = !!this.data.vehicle_connected;
  }

  public getEvseNotReadyReasons(): number[] {
    return this.data.evse_not_ready_reasons || [];
  }

  public getContactorClosed(): boolean {
    return !!this.data.contactor_closed;
  }

  public getVehicleConnected(): boolean {
    return this.vehicle_connected;
  }

  public getSessionS(): number {
    return this.data.session_s || 0;
  }

  public getGridV(): number {
    return this.data.grid_v || 0;
  }

  public getGridHz(): number {
    return this.data.grid_hz || 0;
  }

  public getVehicleCurrentA(): number {
    return this.data.vehicle_current_a || 0;
  }

  public getCurrentA_a(): number {
    return this.data.currentA_a || 0;
  }

  public getCurrentB_a(): number {
    return this.data.currentB_a || 0;
  }

  public getCurrentC_a(): number {
    return this.data.currentC_a || 0;
  }

  public getCurrentN_a(): number {
    return this.data.currentN_a || 0;
  }

  public getVoltageA_v(): number {
    return this.data.voltageA_v || 0;
  }

  public getVoltageB_v(): number {
    return this.data.voltageB_v || 0;
  }

  public getVoltageC_v(): number {
    return this.data.voltageC_v || 0;
  }

  public getRelayCoilV(): number {
    return this.data.relay_coil_v || 0;
  }

  public getPcbaTempC(): number {
    return this.data.pcba_temp_c || 0;
  }

  public getHandleTempC(): number {
    return this.data.handle_temp_c || 0;
  }

  public getMcuTempC(): number {
    return this.data.mcu_temp_c || 0;
  }

  public getUptimeS(): number {
    return this.data.uptime_s || 0;
  }

  public getInputThermopileUV(): number {
    return this.data.input_thermopile_uv || 0;
  }

  public getProxV(): number {
    return this.data.prox_v || 0;
  }

  public getPilotHighV(): number {
    return this.data.pilot_high_v || 0;
  }

  public getPilotLowV(): number {
    return this.data.pilot_low_v || 0;
  }

  public getSessionEnergyWh(): number {
    return this.data.session_energy_wh || 0;
  }

  public getConfigStatus(): number {
    return this.data.config_status || 0;
  }

  public getEvseState(): number {
    return this.data.evse_state || 0;
  }

  public getEvseStateV2(): EVSEState | undefined {
    if (this.data.evse_state === undefined) {
      return undefined;
    }
    return getEVSEStateFromNumber(this.data.evse_state);
  }

  public getCurrentAlerts(): string[] {
    return this.data.current_alerts || [];
  }
}
