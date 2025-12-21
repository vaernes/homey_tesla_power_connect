import Homey from 'homey';
import { TWC } from '../../lib/twc';
import { vitals } from '../../lib/vitals';
import { EVSEState, getEVSEStateString } from '../../lib/evsestate';

export enum HomeyEVChargerChargingState {
  PluggedInCharging = 'plugged_in_charging',
  PluggedInDischarging = 'plugged_in_discharging',
  PluggedInPaused = 'plugged_in_paused',
  PluggedIn = 'plugged_in',
  PluggedOut = 'plugged_out'
}

interface CapabilityMapping {
  capability: string;
  valueGetter: (vit: vitals) => any;
  transform?: (val: any) => any;
  condition?: (vit: vitals) => boolean;
}

export class TWCDevice extends Homey.Device {

  private api!: TWC | null;
  private pollIntervals: NodeJS.Timeout[] = [];
  private _charging_status_changed!: Homey.FlowCardTriggerDevice | null;

  async onDeleted() {
    this.cleanupPolling();
    this.api = null;
  }

  private cleanupPolling() {
    if (this.pollIntervals) {
      this.pollIntervals.forEach((interval) => clearInterval(interval));
      this.pollIntervals = [];
    }
  }

  async onInit() {
    this.api = new TWC(this.getData().ip);
    this.getChargerState().catch(this.error);
    const settings = this.getSettings();
    this.cleanupPolling();
    this.pollIntervals.push(setInterval(() => {
      this.getChargerState();
    }, settings.polling_interval * 1000));

    await this.ensureCapabilities([
      'meter_power.total',
      'meter_power',
      'measure_power',
      'evcharger_charging_state',
      'evse_state',
      'measure_evse_state',
    ]);

    this.registerFlows();
    this._charging_status_changed = this.homey.flow.getDeviceTriggerCard('charger_status_changed');
  }

  private async ensureCapabilities(capabilities: string[]) {
    for (const cap of capabilities) {
      if (!this.hasCapability(cap)) {
        await this.addCapability(cap);
      }
    }
  }

  private registerFlows() {
    const chargingCondition = this.homey.flow.getConditionCard('is_charging');
    chargingCondition.registerRunListener(async (args) => {
      const status = args.device.getCapabilityValue('alarm_twc_state.evse');
      return status === 'Charging';
    });

    const connectedCondition = this.homey.flow.getConditionCard('is_connected');
    connectedCondition.registerRunListener(async (args) => {
      const status = args.device.getCapabilityValue('alarm_twc_state.evse');
      return status === 'Connected';
    });
  }

  async onSettings(event: { oldSettings: object, newSettings: any, changedKeys: string[] }): Promise<string | void> {
    this.log('Settings changed');
    if (event.changedKeys.indexOf('polling_interval') > -1) {
      this.cleanupPolling();
      this.log(`Change poll interval ${event.newSettings.polling_interval}`);
      this.pollIntervals.push(setInterval(() => {
        this.getChargerState();
      }, event.newSettings.polling_interval * 1000));
    }
    if (event.changedKeys.indexOf('voltage_adjustment') > -1) {
      this.getChargerState();
    }
  }

  toHoursAndMinutes(totalSeconds: number): string {
    const totalMinutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  getVoltageAdjustment(): number {
    try {
      return this.getSetting('voltage_adjustment') || 0;
    } catch (e) {
      this.error(e);
      return 0;
    }
  }

  private calculatePower(vit: vitals): number {
    // V2 calculation logic preferred as per review findings
    const a = vit.getVoltageA_v() * vit.getCurrentA_a();
    const b = vit.getVoltageB_v() * vit.getCurrentB_a();
    const c = vit.getVoltageC_v() * vit.getCurrentC_a();
    return a + b + c;
  }

  async isCharging(): Promise<boolean> {
    if (this.api !== null) {
      const vit = await this.api.getVitals();
      if (vit !== null) {
        // Reusing new consolidated state logic
        const { status } = this.determineEvseState(vit);
        return status === 'Charging';
      }
    }
    return false;
  }

  async isConnected(): Promise<boolean> {
    if (this.api !== null) {
      const vit = await this.api.getVitals();
      if (vit !== null) {
        return vit.vehicle_connected;
      }
    }
    return false;
  }

  toString(arr: string[]): string {
    try {
      if (arr && arr.length !== 0) {
        return arr.join(', ');
      }
      return '';
    } catch {
      this.error('');
      return '';
    }
  }

  decodeSsid(encoded: string): string {
    try {
      if (encoded && encoded.length !== 0) {
        return Buffer.from(encoded, 'base64').toString('binary');
      }
    } catch (e) {
      this.error(e);
    }
    return '';
  }

  // Unified State Logic
  private determineEvseState(vit: vitals): { state: HomeyEVChargerChargingState, status: string, power: number } {
    let state: HomeyEVChargerChargingState = HomeyEVChargerChargingState.PluggedOut;
    let status = 'Error';
    let power = 0;

    const evseState = vit.getEvseStateV2();

    switch (evseState) {
      case EVSEState.Charging:
      case EVSEState.ChargePowerReduced:
        state = HomeyEVChargerChargingState.PluggedInCharging;
        status = 'Charging';
        power = this.calculatePower(vit);
        break;
      case EVSEState.ReadyToChargeWaitingOnVehicle: // Ready, Waiting for vehicle
      case EVSEState.ConnectedReady: // Ready, Connected
        state = HomeyEVChargerChargingState.PluggedInPaused;
        status = 'Connected';
        break;
      case EVSEState.ConnectedFinishedCharging:
        state = HomeyEVChargerChargingState.PluggedIn;
        status = 'Finished';
        break;
      case EVSEState.ConnectedFullyCharged:
        state = HomeyEVChargerChargingState.PluggedIn;
        status = 'Finished';
        break;
      case EVSEState.ConnectedNegotiating:
      case EVSEState.ConnectedNotReady:
        state = HomeyEVChargerChargingState.PluggedIn;
        status = 'Connected';
        break;
      case EVSEState.NoVehicleConnected:
        state = HomeyEVChargerChargingState.PluggedOut;
        status = 'Disconnected';
        break;
      default:
        state = HomeyEVChargerChargingState.PluggedOut;
        status = 'Error'; // Or unknown
    }
    return { state, status, power };
  }

  async getChargerState() {
    if (this.api === null) return;

    // --- Wifi Status ---
    try {
      const wifi = await this.api.getWifiStatus();
      if (wifi) {
        await this.setSettings({
          wifi_ssid: this.decodeSsid(wifi.getWifiSsid()),
          wifi_signal_strength: `${wifi.getWifiSignalStrength()}%`,
          wifi_rssi: `${wifi.getWifiRssi()}dB`,
          wifi_snr: `${wifi.getWifiSnr()}dB`,
          wifi_connected: wifi.getWifiConnected() ? 'Yes' : 'No',
          wifi_infra_ip: wifi.getWifiInfraIp(),
          internet: wifi.getInternet() ? 'Yes' : 'No',
          wifi_mac: wifi.getWifiMac(),
        });
      }
    } catch (e) {
      this.error('Error fetching/setting Wifi status', e);
    }

    // --- Lifetime Stats ---
    try {
      const life = await this.api.getLifetime();
      if (life) {
        const total = life.getEnergyWh() / 1000;
        await this.setSettings({
          contactor_cycles: life.getContactorCycles(),
          contactor_cycles_loaded: life.getContactorCyclesLoaded(),
          alert_count: life.getAlertCount(),
          thermal_foldbacks: life.getThermalFoldbacks(),
          avg_startup_temp: life.getAvgStartupTemp(),
          charge_starts: life.getChargeStarts(),
          enrgy_wh: `${total.toString()}kWh`,
          connector_cycles: life.getConnectorCycles(),
          uptime_s: this.toHoursAndMinutes(life.getUptimeS()),
          charging_time_s: this.toHoursAndMinutes(life.getChargingTimeS()),
        });
        await this.setCapabilityValue('meter_power.total', total).catch(this.error);
        if (this.hasCapability('meter_power')) {
          await this.setCapabilityValue('meter_power', total).catch(this.error);
        }
      }
    } catch (e) {
      this.error('Error fetching/setting Lifetime', e);
    }

    // --- Version Info ---
    try {
      const ver = await this.api.getVersion();
      if (ver) {
        await this.setSettings({
          firmware_version: ver.getFirmwareVersion(),
          part_number: ver.getPartNumber(),
          serial_number: ver.getSerialNumber(),
        });
      }
    } catch (e) {
      this.error('Error fetching/setting Version', e);
    }

    // --- Vitals (Capabilities) ---
    try {
      const vit = await this.api.getVitals();
      if (vit) {
        // 1. Update Standard Capabilities via Mapping
        const mappings: CapabilityMapping[] = [
          { capability: 'meter_power.vehicle', valueGetter: (v) => v.getSessionEnergyWh() / 1000 },
          { capability: 'measure_current.vehicle', valueGetter: (v) => v.getVehicleCurrentA() },
          { capability: 'measure_current.a', valueGetter: (v) => v.getCurrentA_a() },
          { capability: 'measure_current.b', valueGetter: (v) => v.getCurrentB_a() },
          { capability: 'measure_current.c', valueGetter: (v) => v.getCurrentC_a() },
          { capability: 'measure_current.n', valueGetter: (v) => v.getCurrentN_a() },
          { capability: 'measure_twc_voltage.a', valueGetter: (v) => v.getVoltageA_v() + this.getVoltageAdjustment() },
          { capability: 'measure_twc_voltage.b', valueGetter: (v) => v.getVoltageB_v() + this.getVoltageAdjustment() },
          { capability: 'measure_twc_voltage.c', valueGetter: (v) => v.getVoltageC_v() + this.getVoltageAdjustment() },
          { capability: 'measure_temperature.handle', valueGetter: (v) => v.getHandleTempC() },
          { capability: 'measure_temperature.mcu', valueGetter: (v) => v.getMcuTempC() },
          { capability: 'measure_temperature.pcba', valueGetter: (v) => v.getPcbaTempC() },
          { capability: 'measure_temperature.charger', valueGetter: (v) => (v.getMcuTempC() + v.getPcbaTempC()) / 2 },
          { capability: 'measure_twc_voltage.grid', valueGetter: (v) => v.getGridV() + this.getVoltageAdjustment() },
          { capability: 'measure_frequency.grid', valueGetter: (v) => v.getGridHz() },
          { capability: 'measure_twc_voltage.relay_coil_v', valueGetter: (v) => v.getRelayCoilV() },
          { capability: 'measure_twc_voltage.prox_v', valueGetter: (v) => v.getProxV() },
          { capability: 'measure_twc_voltage.pilot_high_v', valueGetter: (v) => v.getPilotHighV() },
          { capability: 'measure_twc_voltage.pilot_low_v', valueGetter: (v) => v.getPilotLowV() },
          { capability: 'evse_state', valueGetter: (v) => getEVSEStateString(v.getEvseState()) },
          { capability: 'measure_evse_state', valueGetter: (v) => v.getEvseState() },
          { capability: 'alarm_twc_state.contactor', valueGetter: (v) => (v.getContactorClosed() ? 'Closed' : 'Open') },
        ];

        for (const m of mappings) {
          try {
            if (m.condition && !m.condition(vit)) continue;
            const val = m.valueGetter(vit);
            await this.setCapabilityValue(m.capability, m.transform ? m.transform(val) : val);
          } catch (err: any) {
            // Silent fail for individual capability updates is acceptable, but logging is good
            this.log(`Failed to set ${m.capability}:`, err.message || err);
          }
        }

        // 2. Handle Complex State Logic (Status & Charging State)
        const { state, status, power } = this.determineEvseState(vit);

        await this.setCapabilityValue('measure_twc_power.vehicle', power).catch(this.error);
        if (this.hasCapability('measure_power')) {
          await this.setCapabilityValue('measure_power', power).catch(this.error);
        }

        const currentStatus = this.getCapabilityValue('alarm_twc_state.evse');
        if (currentStatus !== status) {
          await this.setCapabilityValue('alarm_twc_state.evse', status).catch(this.error);
          // Trigger flow
          if (this._charging_status_changed) {
            this._charging_status_changed.trigger(this, { status }, {}).catch(this.error);
          }
        }

        const currentStateV2 = this.getCapabilityValue('evcharger_charging_state');
        if (currentStateV2 !== state) {
          await this.setCapabilityValue('evcharger_charging_state', state).catch(this.error);
        }

        // 3. Update Vitals Settings
        await this.setSettings({
          session_s: this.toHoursAndMinutes(vit.getSessionS()),
          uptime_s: this.toHoursAndMinutes(vit.getUptimeS()),
          evse_state: vit.getEvseState().toString(),
          config_status: vit.getConfigStatus().toString(),
          current_alerts: this.toString(vit.getCurrentAlerts()),
        }).catch((e) => this.error('Error setting Vitals settings', e));

      }
    } catch (e) {
      this.error('Error fetching Vitals', e);
    }
  }
}
module.exports = TWCDevice;
