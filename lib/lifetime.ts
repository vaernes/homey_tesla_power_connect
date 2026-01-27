export class TWCLifetime {
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
    return (this.contactor_cycles || 0).toString();
  }

  public getContactorCyclesLoaded(): string {
    return (this.contactor_cycles_loaded || 0).toString();
  }

  public getAlertCount(): string {
    return (this.alert_count || 0).toString();
  }

  public getThermalFoldbacks(): string {
    return (this.thermal_foldbacks || 0).toString();
  }

  public getAvgStartupTemp(): string {
    return (this.avg_startup_temp || 0).toString();
  }

  public getChargeStarts(): string {
    return (this.charge_starts || 0).toString();
  }

  public getEnergyWh(): number {
    return this.energy_wh || 0;
  }

  public getConnectorCycles(): string {
    return (this.connector_cycles || 0).toString();
  }

  public getUptimeS(): number {
    return this.uptime_s || 0;
  }

  public getChargingTimeS(): number {
    return this.charging_time_s || 0;
  }
}
