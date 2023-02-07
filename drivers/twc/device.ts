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
  }

  toHoursAndMinutes(totalSeconds: number): string {
    const totalMinutes = Math.floor(totalSeconds / 60);

    const seconds = totalSeconds % 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours + "h " + minutes + "m " + seconds + "s";
  }

  calculatePower( vit: vitals ): number {

    let bugFixVoltage=0;
    if( this.getSetting("firmware_version") == "22.41.2+gdb42f98c0aafdd"){
      bugFixVoltage=10;
    }
    let a = Math.floor(vit.voltageA_v) == 0 ? 0 : 1;
    let b = Math.floor(vit.voltageB_v) == 0 ? 0 : 1;
    let c = Math.floor(vit.voltageC_v) == 0 ? 0 : 1;
    let numberOfLines = a + b + c;
    let powerFactor = 1;
    if (numberOfLines >= 2) {
      powerFactor = 1.732;
    }
    
   /* let aW = vit.currentA_a*vit.voltageA_v;
    let bW = vit.currentB_a*vit.voltageB_v;
    let cW = vit.currentC_a*vit.voltageC_v;
    this.log('aW='+aW.toString());
    this.log('bW='+bW.toString());
    this.log('cW='+cW.toString());
    return ((aW+bW+cW)/numberOfLines)*powerFactor;*/
    return vit.vehicle_current_a  * (vit.grid_v+bugFixVoltage) * powerFactor;
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
      self.setSettings({
        wifi_ssid: this.decodeSsid(wifi.wifi_ssid),
        wifi_signal_strength: wifi.wifi_signal_strength.toString() + "%",
        wifi_rssi: wifi.wifi_rssi.toString() + "dB",
        wifi_snr: wifi.wifi_snr.toString() + "dB",
        wifi_connected: wifi.wifi_connected ? "Yes" : "No",
        wifi_infra_ip: wifi.wifi_infra_ip,
        internet: wifi.internet ? "Yes" : "No",
        wifi_mac: wifi.wifi_mac
      }).catch(res => self.log("Error setting WiFi"));
    }

    const life = (await self.api.getLifetime());
    if (life != null) {
      self.setSettings({
        contactor_cycles: life.contactor_cycles.toString(),
        contactor_cycles_loaded: life.contactor_cycles_loaded.toString(),
        alert_count: life.alert_count.toString(),
        thermal_foldbacks: life.thermal_foldbacks.toString(),
        avg_startup_temp: life.avg_startup_temp.toString(),
        charge_starts: life.charge_starts.toString(),
        energy_wh: (life.energy_wh / 1000).toString() + "kWh",
        connector_cycles: life.connector_cycles.toString(),
        uptime_s: self.toHoursAndMinutes(life.uptime_s),
        charging_time_s: self.toHoursAndMinutes(life.charging_time_s)

      }).catch(res => self.log("Error setting Lifetime"));
    }

    const ver = (await self.api.getVersion());
    if (ver != null) {
      self.setSettings({
        firmware_version: ver.firmware_version,
        part_number: ver.part_number,
        serial_number: ver.serial_number
      }).catch(res => self.log("Error setting Version"));
    }

    const vit = (await self.api.getVitals());
    if (vit != null) {
      try {
        self.setCapabilityValue('meter_power.vehicle', vit.session_energy_wh / 1000).catch(e => self.log("Error setting meter_power.vehicle"));
        self.setCapabilityValue('measure_current.vehicle', vit.vehicle_current_a).catch(e => self.log("Error setting measure_current.vehicle"));
        self.setCapabilityValue('measure_current.a', vit.currentA_a).catch(e => self.log("Error setting measure_current.a"));
        self.setCapabilityValue('measure_current.b', vit.currentB_a).catch(e => self.log("Error setting measure_current.b"));
        self.setCapabilityValue('measure_current.c', vit.currentC_a).catch(e => self.log("Error setting measure_current.c"));
        self.setCapabilityValue('measure_current.n', vit.currentN_a).catch(e => self.log("Error setting measure_current.n"));
        self.setCapabilityValue('measure_twc_voltage.a', vit.voltageA_v).catch(e => self.log("Error setting measure_twc_voltage.a"));
        self.setCapabilityValue('measure_twc_voltage.b', vit.voltageB_v).catch(e => self.log("Error setting measure_twc_voltage.b"));
        self.setCapabilityValue('measure_twc_voltage.c', vit.voltageC_v).catch(e => self.log("Error setting measure_twc_voltage.c"));
        self.setCapabilityValue('measure_temperature.handle', vit.handle_temp_c).catch(e => self.log("Error setting measure_temperature.handle"));
        self.setCapabilityValue('measure_temperature.mcu', vit.mcu_temp_c).catch(e => self.log("Error setting measure_temperature.mcu"));
        self.setCapabilityValue('measure_temperature.pcba', vit.pcba_temp_c).catch(e => self.log("Error setting measure_temperature.pcba"));
        self.setCapabilityValue('measure_temperature.charger', (vit.mcu_temp_c + vit.pcba_temp_c) / 2).catch(e => self.log("Error setting measure_temperature.charger"));
        self.setCapabilityValue('measure_twc_voltage.grid', vit.grid_v).catch(e => self.log("Error setting measure_twc_voltage.grid"));
        self.setCapabilityValue('measure_frequency.grid', vit.grid_hz).catch(e => self.log("Error setting measure_frequency.grid"));
        self.setCapabilityValue('measure_twc_voltage.relay_coil_v', vit.relay_coil_v).catch(e => self.log("Error setting measure_twc_voltage.relay_coil_v"));
        self.setCapabilityValue('measure_twc_voltage.prox_v', vit.prox_v).catch(e => self.log("Error setting measure_twc_voltage.prox_v"));
        self.setCapabilityValue('measure_twc_voltage.pilot_high_v', vit.pilot_high_v).catch(e => self.log("Error setting measure_twc_voltage.pilot_high_v"));
        self.setCapabilityValue('measure_twc_voltage.pilot_low_v', vit.pilot_low_v).catch(e => self.log("Error setting measure_twc_voltage.pilot_low_v"));
        let state = 'Unknown';
        switch (vit.evse_state) {
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
        }
        self.setCapabilityValue('alarm_twc_state.evse', state).catch(e => self.log("Error setting alarm_twc_state.evse"));
        self.setCapabilityValue('alarm_twc_state.contactor', vit.contactor_closed ? "Closed" : "Open").catch(e => self.log("Error setting alarm_twc_state.contactor"));
      } catch (e) {
        self.log("Error setting setCapabilityValue");
      }
      self.setSettings({
        session_s: self.toHoursAndMinutes(vit.session_s),
        uptime_s: self.toHoursAndMinutes(vit.uptime_s),
        evse_state: vit.evse_state.toString(),
        config_status: vit.config_status.toString(),
        current_alerts: self.toString(vit.current_alerts)
      }).catch(res => self.log("Error setting Vitals"));
    }
  }
}
module.exports = TWCDevice;