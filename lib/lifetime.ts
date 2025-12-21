export class lifetime {
  contactor_cycles!: number;
  contactor_cycles_loaded!: number;
  alert_count!: number;
  thermal_foldbacks!: number;
  avg_startup_temp!: number;
  charge_starts!: number;
  energy_wh!: number;
  connector_cycles!: number;
  uptime_s!: number;
  charging_time_s!: number;

  public constructor(json: any) {
    if (!json) return;
    this.contactor_cycles = json.contactor_cycles;
    this.contactor_cycles_loaded = json.contactor_cycles_loaded;
    this.alert_count = json.alert_count;
    this.thermal_foldbacks = json.thermal_foldbacks;
    this.avg_startup_temp = json.avg_startup_temp;
    this.charge_starts = json.charge_starts;
    this.energy_wh = json.energy_wh;
    this.connector_cycles = json.connector_cycles;
    this.uptime_s = json.uptime_s;
    this.charging_time_s = json.charging_time_s;
  }

  public getContactorCycles(): string {
    if (this.connector_cycles === undefined) {
      return '';
    }
    return this.connector_cycles.toString();
  }

  public getContactorCyclesLoaded(): string {
    if (this.contactor_cycles_loaded === undefined) {
      return '';
    }
    return this.contactor_cycles_loaded.toString();
  }

  public getAlertCount(): string {
    if (this.alert_count === undefined) {
      return '';
    }
    return this.alert_count.toString();
  }

  public getThermalFoldbacks(): string {
    if (this.thermal_foldbacks === undefined) {
      return '';
    }
    return this.thermal_foldbacks.toString();
  }

  public getAvgStartupTemp(): string {
    if (this.avg_startup_temp === undefined) {
      return '';
    }
    return this.avg_startup_temp.toString();
  }

  public getChargeStarts(): string {
    if (this.charge_starts === undefined) {
      return '';
    }
    return this.charge_starts.toString();
  }

  public getEnergyWh(): number {
    if (this.energy_wh === undefined) {
      return 0;
    }
    return this.energy_wh;
  }

  public getConnectorCycles(): string {
    if (this.connector_cycles === undefined) {
      return '';
    }
    return this.connector_cycles.toString();
  }

  public getUptimeS(): number {
    if (this.uptime_s === undefined) {
      return 0;
    }
    return this.uptime_s;
  }

  public getChargingTimeS(): number {
    if (this.charging_time_s === undefined) {
      return 0;
    }
    return this.charging_time_s;
  }
}
