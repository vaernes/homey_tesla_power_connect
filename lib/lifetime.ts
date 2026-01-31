interface LifetimeData {
  contactor_cycles?: number;
  contactor_cycles_loaded?: number;
  alert_count?: number;
  thermal_foldbacks?: number;
  avg_startup_temp?: number;
  charge_starts?: number;
  energy_wh?: number;
  connector_cycles?: number;
  uptime_s?: number;
  charging_time_s?: number;
}

export class TWCLifetime {
  private readonly data: LifetimeData;

  public constructor(json: any) {
    this.data = json || {};
  }

  public getContactorCycles(): string {
    return (this.data.contactor_cycles || 0).toString();
  }

  public getContactorCyclesLoaded(): string {
    return (this.data.contactor_cycles_loaded || 0).toString();
  }

  public getAlertCount(): string {
    return (this.data.alert_count || 0).toString();
  }

  public getThermalFoldbacks(): string {
    return (this.data.thermal_foldbacks || 0).toString();
  }

  public getAvgStartupTemp(): string {
    return (this.data.avg_startup_temp || 0).toString();
  }

  public getChargeStarts(): string {
    return (this.data.charge_starts || 0).toString();
  }

  public getEnergyWh(): number {
    return this.data.energy_wh || 0;
  }

  public getConnectorCycles(): string {
    return (this.data.connector_cycles || 0).toString();
  }

  public getUptimeS(): number {
    return this.data.uptime_s || 0;
  }

  public getChargingTimeS(): number {
    return this.data.charging_time_s || 0;
  }
}
