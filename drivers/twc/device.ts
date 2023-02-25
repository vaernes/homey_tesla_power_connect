import Homey from 'homey';
import { TWC } from '../../lib/twc';
import { vitals } from '../../lib/vitals';

export class TWCDevice extends Homey.Device {

  private api!: TWC | null;
  private pollIntervals: any;

  async onDeleted() {
    if (this.pollIntervals) {
      this.homey.clearInterval(this.pollIntervals);
    }
    this.api = null;
  }

  async onInit() {
    this.api = new TWC(this.getData().ip);
    this.getChargerState();
    const settings = this.getSettings();
    this.pollIntervals = [];
    this.pollIntervals.push(setInterval(() => { this.getChargerState(); }, settings.polling_interval * 1000));
  }

  async onSettings(event: { oldSettings: {}, newSettings: any, changedKeys: string[] }): Promise<string | void> {
    this.log('Settings where changed');
    if (event.changedKeys.indexOf("polling_interval") > -1) {
      if (this.pollIntervals) {
        this.homey.clearInterval(this.pollIntervals);
      }
      this.log('Change poll interval ' + event.newSettings.polling_interval);
      this.pollIntervals.push(setInterval(() => { this.getChargerState(); }, event.newSettings.polling_interval * 1000));
    }
    if (event.changedKeys.indexOf("voltage_adjustment") > -1) {
      this.getChargerState();
    }
  }

  toHoursAndMinutes(totalSeconds: number): string {
    const totalMinutes = Math.floor(totalSeconds / 60);

    const seconds = totalSeconds % 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours + "h " + minutes + "m " + seconds + "s";
  }

  getVoltageAdjustment() : number{
    try{
      return this.getSetting('voltage_adjustment');
    }catch(e){
      this.log(e);
      return 0;
    }
  }

  calculatePower( vit: vitals ): number {

    let a = Math.floor(vit.getVoltageA_v()) == 0 ? 0 : 1;
    let b = Math.floor(vit.getVoltageB_v()) == 0 ? 0 : 1;
    let c = Math.floor(vit.getVoltageC_v()) == 0 ? 0 : 1;
    let numberOfLines = a + b + c;
    let powerFactor = 1;
    if (numberOfLines >= 2) {
      powerFactor = 1.732;
    }
    return vit.getVehicleCurrentA()  * (vit.getGridV()+this.getVoltageAdjustment()) * powerFactor;
  }

  toString(arr: string[]): string {
    try {
      if (arr != null && arr.length != 0) {
        return arr.join(", ");
      }
      return "";
    } catch (e) {
      this.error("")
      return "";
    }
  }

  decodeSsid(encoded: string): string {
    try {
      if (encoded != null && encoded.length != 0) {
        return Buffer.from(encoded, 'base64').toString('binary');
      }
    } catch (e) {
      this.error(e);
    }
    return "";
  }

  async getChargerState() {
    const self = this;
    if (self.api == null) {
      return;
    }
    
    const wifi = (await self.api.getWifiStatus());
    if (wifi != null) {
      self.setAvailable();
      self.setSettings({
        wifi_ssid: this.decodeSsid(wifi.getWifiSsid()),
        wifi_signal_strength: wifi.getWifiSignalStrength() + "%",
        wifi_rssi: wifi.getWifiRssi() + "dB",
        wifi_snr: wifi.getWifiSnr() + "dB",
        wifi_connected: wifi.getWifiConnected() ? "Yes" : "No",
        wifi_infra_ip: wifi.getWifiInfraIp(),
        internet: wifi.getInternet() ? "Yes" : "No",
        wifi_mac: wifi.getWifiMac()
      }).catch(res => self.log("Error setting WiFi"));
    }else{
      self.setUnavailable('Could not connect to'+ self.getName() + ', check the device IP address!' );
    }

    const life = (await self.api.getLifetime());
    if (life != null) {
      self.setAvailable();
      self.setSettings({
        contactor_cycles: life.getContactorCycles(),
        contactor_cycles_loaded: life.getContactorCyclesLoaded(),
        alert_count: life.getAlertCount(),
        thermal_foldbacks: life.getThermalFoldbacks(),
        avg_startup_temp: life.getAvgStartupTemp(),
        charge_starts: life.getChargeStarts(),
        energy_wh: (life.getEnergyWh() / 1000).toString() + "kWh",
        connector_cycles: life.getConnectorCycles(),
        uptime_s: self.toHoursAndMinutes(life.getUptimeS()),
        charging_time_s: self.toHoursAndMinutes(life.getChargingTimeS())

      }).catch(res => self.log("Error setting Lifetime " + res));
    }else{
      self.setUnavailable('Could not connect to'+ self.getName() + ', check the device IP address!' );
    }

    const ver = (await self.api.getVersion());
    if (ver != null) {
      self.setAvailable();
      self.setSettings({
        firmware_version: ver.getFirmwareVersion(),
        part_number: ver.getPartNumber(),
        serial_number: ver.getSerialNumber()
      }).catch(res => self.log("Error setting Version"));
    }else{
      self.setUnavailable('Could not connect to'+ self.getName() + ', check the device IP address' );
    }

    const vit = (await self.api.getVitals());
    if (vit != null) {
      self.setAvailable();
      try {
        self.setCapabilityValue('meter_power.vehicle', vit.getSessionEnergyWh() / 1000).catch(e => self.log("Error setting meter_power.vehicle"));
        self.setCapabilityValue('measure_current.vehicle', vit.getVehicleCurrentA()).catch(e => self.log("Error setting measure_current.vehicle"));
        self.setCapabilityValue('measure_current.a', vit.getCurrentA_a()).catch(e => self.log("Error setting measure_current.a"));
        self.setCapabilityValue('measure_current.b', vit.getCurrentB_a()).catch(e => self.log("Error setting measure_current.b"));
        self.setCapabilityValue('measure_current.c', vit.getCurrentC_a()).catch(e => self.log("Error setting measure_current.c"));
        self.setCapabilityValue('measure_current.n', vit.getCurrentN_a()).catch(e => self.log("Error setting measure_current.n"));
        self.setCapabilityValue('measure_twc_voltage.a', vit.getVoltageA_v()+this.getVoltageAdjustment()).catch(e => self.log("Error setting measure_twc_voltage.a"));
        self.setCapabilityValue('measure_twc_voltage.b', vit.getVoltageB_v()+this.getVoltageAdjustment()).catch(e => self.log("Error setting measure_twc_voltage.b"));
        self.setCapabilityValue('measure_twc_voltage.c', vit.getVoltageC_v()+this.getVoltageAdjustment()).catch(e => self.log("Error setting measure_twc_voltage.c"));
        self.setCapabilityValue('measure_temperature.handle', vit.getHandleTempC()).catch(e => self.log("Error setting measure_temperature.handle"));
        self.setCapabilityValue('measure_temperature.mcu', vit.getMcuTempC()).catch(e => self.log("Error setting measure_temperature.mcu"));
        self.setCapabilityValue('measure_temperature.pcba', vit.getPcbaTempC()).catch(e => self.log("Error setting measure_temperature.pcba"));
        self.setCapabilityValue('measure_temperature.charger', (vit.getMcuTempC() + vit.getPcbaTempC()) / 2).catch(e => self.log("Error setting measure_temperature.charger"));
        self.setCapabilityValue('measure_twc_voltage.grid', vit.getGridV()+this.getVoltageAdjustment()).catch(e => self.log("Error setting measure_twc_voltage.grid"));
        self.setCapabilityValue('measure_frequency.grid', vit.getGridHz()).catch(e => self.log("Error setting measure_frequency.grid"));
        self.setCapabilityValue('measure_twc_voltage.relay_coil_v', vit.getRelayCoilV()).catch(e => self.log("Error setting measure_twc_voltage.relay_coil_v"));
        self.setCapabilityValue('measure_twc_voltage.prox_v', vit.getProxV()).catch(e => self.log("Error setting measure_twc_voltage.prox_v"));
        self.setCapabilityValue('measure_twc_voltage.pilot_high_v', vit.getPilotHighV()).catch(e => self.log("Error setting measure_twc_voltage.pilot_high_v"));
        self.setCapabilityValue('measure_twc_voltage.pilot_low_v', vit.getPilotLowV()).catch(e => self.log("Error setting measure_twc_voltage.pilot_low_v"));
        let state = 'Unknown';
        switch (vit.getEvseState()) {
          case 11:
            state = "Charging";
            self.setCapabilityValue('measure_twc_power.vehicle', self.calculatePower(vit)).catch(e => self.log("Error setting measure_twc_power.vehicle"));
            break;
          case 9:
            state = "Connected"; //Ready, Waiting for vehicle
            self.setCapabilityValue('measure_twc_power.vehicle', 0).catch(e => self.log("Error setting measure_twc_power.vehicle"));
            break;
          case 4:
            state = "Connected"; //Ready, Connected
            self.setCapabilityValue('measure_twc_power.vehicle', 0).catch(e => self.log("Error setting measure_twc_power.vehicle"));
            break;
          case 1:
            state = "Disconnected";
            self.setCapabilityValue('measure_twc_power.vehicle', 0).catch(e => self.log("Error setting measure_twc_power.vehicle"));
            break;
          default:
            state = "Unknown";
            self.setCapabilityValue('measure_twc_power.vehicle', 0).catch(e => self.log("Error setting measure_twc_power.vehicle"));
        }
        self.setCapabilityValue('alarm_twc_state.evse', state).catch(e => self.log("Error setting alarm_twc_state.evse"));
        self.setCapabilityValue('alarm_twc_state.contactor', vit.getContactorClosed() ? "Closed" : "Open").catch(e => self.log("Error setting alarm_twc_state.contactor"));
      } catch (e) {
        self.log("Error setting setCapabilityValue");
      }
      self.setSettings({
        session_s: self.toHoursAndMinutes(vit.getSessionS()),
        uptime_s: self.toHoursAndMinutes(vit.getUptimeS()),
        evse_state: vit.getEvseState().toString(),
        config_status: vit.getConfigStatus().toString(),
        current_alerts: self.toString(vit.getCurrentAlerts())
      }).catch(res => self.log("Error setting Vitals"));
    }else{
      self.setUnavailable('Could not connect to'+ self.getName() + ', check the device IP address' );
    }
  }
}
module.exports = TWCDevice;