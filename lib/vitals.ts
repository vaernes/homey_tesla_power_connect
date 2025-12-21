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
  }

  public getContactorClosed(): boolean {
    if (this.contactor_closed === undefined) {
      return false;
    }
    return this.contactor_closed;
  }

  public getVehicleConnected(): boolean {
    if (this.vehicle_connected === undefined) {
      return false;
    }
    return this.vehicle_connected;
  }

  public getSessionS(): number {
    if (this.session_s === undefined) {
      return 0;
    }
    return this.session_s;
  }

  public getGridV(): number {
    if (this.grid_v === undefined) {
      return 0;
    }
    return this.grid_v;
  }

  public getGridHz(): number {
    if (this.grid_hz === undefined) {
      return 0;
    }
    return this.grid_hz;
  }

  public getVehicleCurrentA(): number {
    if (this.vehicle_current_a === undefined) {
      return 0;
    }
    return this.vehicle_current_a;
  }

  public getCurrentA_a(): number {
    if (this.currentA_a === undefined) {
      return 0;
    }
    return this.currentA_a;
  }

  public getCurrentB_a(): number {
    if (this.currentB_a === undefined) {
      return 0;
    }
    return this.currentB_a;
  }

  public getCurrentC_a(): number {
    if (this.currentC_a === undefined) {
      return 0;
    }
    return this.currentC_a;
  }

  public getCurrentN_a(): number {
    if (this.currentN_a === undefined) {
      return 0;
    }
    return this.currentN_a;
  }

  public getVoltageA_v(): number {
    if (this.voltageA_v === undefined) {
      return 0;
    }
    return this.voltageA_v;
  }

  public getVoltageB_v(): number {
    if (this.voltageB_v === undefined) {
      return 0;
    }
    return this.voltageB_v;
  }

  public getVoltageC_v(): number {
    if (this.voltageC_v === undefined) {
      return 0;
    }
    return this.voltageC_v;
  }

  public getRelayCoilV(): number {
    if (this.relay_coil_v === undefined) {
      return 0;
    }
    return this.relay_coil_v;
  }

  public getPcbaTempC(): number {
    if (this.pcba_temp_c === undefined) {
      return 0;
    }
    return this.pcba_temp_c;
  }

  public getHandleTempC(): number {
    if (this.handle_temp_c === undefined) {
      return 0;
    }
    return this.handle_temp_c;
  }

  public getMcuTempC(): number {
    if (this.mcu_temp_c === undefined) {
      return 0;
    }
    return this.mcu_temp_c;
  }

  public getUptimeS(): number {
    if (this.uptime_s === undefined) {
      return 0;
    }
    return this.uptime_s;
  }

  public getInputThermopileUV(): number {
    if (this.input_thermopile_uv === undefined) {
      return 0;
    }
    return this.input_thermopile_uv;
  }

  public getProxV(): number {
    if (this.prox_v === undefined) {
      return 0;
    }
    return this.prox_v;
  }

  public getPilotHighV(): number {
    if (this.pilot_high_v === undefined) {
      return 0;
    }
    return this.pilot_high_v;
  }

  public getPilotLowV(): number {
    if (this.pilot_low_v === undefined) {
      return 0;
    }
    return this.pilot_low_v;
  }

  public getSessionEnergyWh(): number {
    if (this.session_energy_wh === undefined) {
      return 0;
    }
    return this.session_energy_wh;
  }

  public getConfigStatus(): number {
    if (this.config_status === undefined) {
      return 0;
    }
    return this.config_status;
  }

  public getEvseState(): number {
    if (this.evse_state === undefined) {
      return 0;
    }
    return this.evse_state;
  }

  public getEvseStateV2(): EVSEState | undefined {
    if (this.evse_state === undefined) {
      return undefined;
    }
    return getEVSEStateFromNumber(this.evse_state);
  }

  public getCurrentAlerts(): string[] {
    if (this.current_alerts === undefined) {
      return [];
    }
    return this.current_alerts;
  }
}
