import Homey from 'homey';
import { TWC } from '../../lib/twc';
import { TWCVitals } from '../../lib/vitals';
import { TWCVersion } from '../../lib/version';
import { EVSEState, getEVSEStateString } from '../../lib/evsestate';
import {
  Capability, Settings, Debug, BooleanState, Flow,
  Unit, ChargeStatus, PollStatus, Log,
} from '../../lib/constants';

export enum HomeyEVChargerChargingState {
  PluggedInCharging = 'plugged_in_charging',
  PluggedInDischarging = 'plugged_in_discharging',
  PluggedInPaused = 'plugged_in_paused',
  PluggedIn = 'plugged_in',
  PluggedOut = 'plugged_out'
}

interface CapabilityMapping {
  capability: string;
  // eslint-disable-next-line no-use-before-define
  valueGetter: (vit: TWCVitals, device: TWCDevice) => any;
  transform?: (val: any) => any;
  condition?: (vit: TWCVitals) => boolean;
}

const MAPPINGS: CapabilityMapping[] = [
  { capability: Capability.METER_POWER_VEHICLE, valueGetter: (v) => v.getSessionEnergyWh() / 1000 },
  { capability: Capability.MEASURE_CURRENT_VEHICLE, valueGetter: (v) => v.getVehicleCurrentA() },
  { capability: Capability.MEASURE_CURRENT_A, valueGetter: (v) => v.getCurrentA_a() },
  { capability: Capability.MEASURE_CURRENT_B, valueGetter: (v) => v.getCurrentB_a() },
  { capability: Capability.MEASURE_CURRENT_C, valueGetter: (v) => v.getCurrentC_a() },
  { capability: Capability.MEASURE_CURRENT_N, valueGetter: (v) => v.getCurrentN_a() },
  { capability: Capability.MEASURE_TWC_VOLTAGE_A, valueGetter: (v, d) => v.getVoltageA_v() + d.getVoltageAdjustment() },
  { capability: Capability.MEASURE_TWC_VOLTAGE_B, valueGetter: (v, d) => v.getVoltageB_v() + d.getVoltageAdjustment() },
  { capability: Capability.MEASURE_TWC_VOLTAGE_C, valueGetter: (v, d) => v.getVoltageC_v() + d.getVoltageAdjustment() },
  { capability: Capability.MEASURE_TEMPERATURE_HANDLE, valueGetter: (v) => v.getHandleTempC() },
  { capability: Capability.MEASURE_TEMPERATURE_MCU, valueGetter: (v) => v.getMcuTempC() },
  { capability: Capability.MEASURE_TEMPERATURE_PCBA, valueGetter: (v) => v.getPcbaTempC() },
  { capability: Capability.MEASURE_TEMPERATURE_CHARGER, valueGetter: (v) => (v.getMcuTempC() + v.getPcbaTempC()) / 2 },
  { capability: Capability.MEASURE_TWC_VOLTAGE_GRID, valueGetter: (v, d) => v.getGridV() + d.getVoltageAdjustment() },
  { capability: Capability.MEASURE_FREQUENCY_GRID, valueGetter: (v) => v.getGridHz() },
  { capability: Capability.MEASURE_TWC_VOLTAGE_RELAY_COIL_V, valueGetter: (v) => v.getRelayCoilV() },
  { capability: Capability.MEASURE_TWC_VOLTAGE_PROX_V, valueGetter: (v) => v.getProxV() },
  { capability: Capability.MEASURE_TWC_VOLTAGE_PILOT_HIGH_V, valueGetter: (v) => v.getPilotHighV() },
  { capability: Capability.MEASURE_TWC_VOLTAGE_PILOT_LOW_V, valueGetter: (v) => v.getPilotLowV() },
  { capability: Capability.EVSE_STATE, valueGetter: (v) => getEVSEStateString(v.getEvseState()) },
  { capability: Capability.MEASURE_EVSE_STATE, valueGetter: (v) => v.getEvseState() },

  { capability: Capability.ALARM_TWC_STATE_CONTACTOR, valueGetter: (v) => (v.getContactorClosed() ? 'Closed' : 'Open') },
  // Signal strength is from wifi status, not vitals directly, handled separately or we need to pass wifi object
  // Since MAPPINGS is strictly for Vitals currently, we'll handle signal strength in getChargerState directly
  // or extend the mapping system. For simplicity, let's handle it in the WiFi section of getChargerState.
  { capability: Capability.MEASURE_VOLTAGE_THERMOPILE, valueGetter: (v) => v.getInputThermopileUV() / 1000000 },
];

export class TWCDevice extends Homey.Device {

  private api!: TWC | null;
  private pollIntervals: NodeJS.Timeout[] = [];
  private _charging_status_changed!: Homey.FlowCardTriggerDevice | null;

  // Debug state tracking
  private lastSuccessfulPoll: string = 'Never';
  private lastFailedPoll: string = 'Never';
  private lastError: string = 'None';
  private consecutiveFailures: number = 0;
  private totalPollCount: number = 0;
  private totalFailureCount: number = 0;

  async onDeleted() {
    this.cleanupPolling();
    this.api = null;
  }

  private cleanupPolling() {
    if (this.pollIntervals) {
      this.pollIntervals.forEach((interval) => clearTimeout(interval));
      this.pollIntervals = [];
    }
  }

  async onInit() {
    this.log(`${Log.INIT_TWC}${this.getName()}...`);
    let address = this.getData().ip;
    const storedAddress = this.getStoreValue(Settings.IP);
    if (storedAddress) {
      address = storedAddress;
    } else {
      // Initialize store with data ip if missing
      await this.setStoreValue(Settings.IP, address).catch(this.error);
    }

    this.api = new TWC(address);

    const settings = this.getSettings();

    // Clean up any existing polling intervals
    this.cleanupPolling();
    this.pollIntervals.push(setTimeout(() => {
      this.getChargerState();
    }, 1000));

    await this.ensureCapabilities([
      Capability.METER_POWER_TOTAL,
      Capability.METER_POWER,
      Capability.MEASURE_POWER,
      Capability.EVCHARGER_CHARGING_STATE,
      Capability.EVSE_STATE,
      Capability.MEASURE_EVSE_STATE,
      Capability.MEASURE_TWC_POWER_VEHICLE,
      Capability.METER_POWER_VEHICLE,
      Capability.ALARM_TWC_STATE_EVSE,
      Capability.MEASURE_CURRENT_VEHICLE,
      Capability.MEASURE_CURRENT_A,
      Capability.MEASURE_CURRENT_B,
      Capability.MEASURE_CURRENT_C,
      Capability.MEASURE_CURRENT_N,
      Capability.MEASURE_TWC_VOLTAGE_A,
      Capability.MEASURE_TWC_VOLTAGE_B,
      Capability.MEASURE_TWC_VOLTAGE_C,
      Capability.MEASURE_TEMPERATURE_HANDLE,
      Capability.MEASURE_TEMPERATURE_MCU,
      Capability.MEASURE_TEMPERATURE_PCBA,
      Capability.MEASURE_TEMPERATURE_CHARGER,
      Capability.MEASURE_TWC_VOLTAGE_GRID,
      Capability.MEASURE_FREQUENCY_GRID,
      Capability.MEASURE_TWC_VOLTAGE_RELAY_COIL_V,
      Capability.MEASURE_TWC_VOLTAGE_PROX_V,
      Capability.MEASURE_TWC_VOLTAGE_PILOT_HIGH_V,
      Capability.MEASURE_TWC_VOLTAGE_PILOT_LOW_V,

      Capability.ALARM_TWC_STATE_CONTACTOR,
      Capability.MEASURE_SIGNAL_STRENGTH,
      Capability.MEASURE_VOLTAGE_THERMOPILE,
      Capability.MEASURE_SNR,
    ]);

    this._charging_status_changed = this.homey.flow.getDeviceTriggerCard(Flow.CHARGER_STATUS_CHANGED);
    const verified = await this.verifyDeviceIdentity();
    if (verified) {
      this.log(`${Log.INIT_SUCCESS}${settings.firmware_version || 'unknown'}`);
    } else {
      this.error(Log.INIT_FAIL_SERIAL);
    }
  }

  private async ensureCapabilities(capabilities: string[]) {
    for (const cap of capabilities) {
      if (!this.hasCapability(cap)) {
        await this.addCapability(cap);
      }
    }
  }

  private async verifyDeviceIdentity(ver?: TWCVersion | null): Promise<boolean> {
    if (!this.api) return false;
    try {
      const version = ver || await this.api.getVersion();
      if (!version) return false;

      const discoveredSerial = version.getSerialNumber();
      const storedSerial = this.getData().id; // The ID is the serial number from pairing

      if (discoveredSerial && storedSerial && discoveredSerial === storedSerial) {
        return true;
      }

      this.error(`${Log.SERIAL_MISMATCH}${storedSerial}, Found: ${discoveredSerial} at ${this.api.address}`);
      await this.setUnavailable(`${Log.SERIAL_MISMATCH}${storedSerial}, Found: ${discoveredSerial}`).catch(this.error);
      return false;

    } catch (e) {
      this.error('Error verifying device identity:', e);
      return false;
    }
  }

  async onSettings(event: { oldSettings: object, newSettings: any, changedKeys: string[] }): Promise<string | void> {
    this.log(Log.SETTINGS_CHANGED);
    if (event.changedKeys.indexOf(Settings.POLLING_INTERVAL) > -1) {
      this.cleanupPolling();
      this.log(`${Log.POLL_INTERVAL_CHANGED}${event.newSettings.polling_interval}`);
      this.pollIntervals.push(setTimeout(() => {
        this.getChargerState();
      }, event.newSettings.polling_interval * 1000));
    }
    if (event.changedKeys.indexOf(Settings.VOLTAGE_ADJUSTMENT) > -1) {
      this.getChargerState();
    }
  }

  humanizeDuration(totalSeconds: number): string {
    const months = Math.floor(totalSeconds / 2592000); // 30 days
    const weeks = Math.floor((totalSeconds % 2592000) / 604800);
    const days = Math.floor((totalSeconds % 604800) / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (months > 0) parts.push(`${months}${Unit.MONTH}`);
    if (weeks > 0) parts.push(`${weeks}${Unit.WEEK}`);
    if (days > 0) parts.push(`${days}${Unit.DAY}`);
    if (hours > 0) parts.push(`${hours}${Unit.HOUR}`);
    if (parts.length < 3 && minutes > 0) parts.push(`${minutes}${Unit.MINUTE}`);
    if (parts.length === 0) parts.push(`${seconds}${Unit.SECOND}`);

    return parts.join(' ') || `0${Unit.SECOND}`;
  }

  humanizeEnergy(wh: number): string {
    if (wh < 1000) return `${wh} ${Unit.WATT_HOUR}`;
    const kwh = wh / 1000;
    if (kwh < 1000) return `${kwh.toFixed(1)} ${Unit.KILO_WATT_HOUR}`;
    const mwh = kwh / 1000;
    return `${mwh.toFixed(2)} ${Unit.MEGA_WATT_HOUR}`;
  }

  getVoltageAdjustment(): number {
    try {
      return this.getSetting(Settings.VOLTAGE_ADJUSTMENT) || 0;
    } catch (e) {
      this.error(e);
      return 0;
    }
  }

  private calculatePower(vit: TWCVitals): number {
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
        return status === ChargeStatus.CHARGING;
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

  private discoveryCache: Map<string, number> = new Map();

  onDiscoveryResult(discoveryResult: Homey.DiscoveryResult): boolean {
    const result = discoveryResult as any;
    const discoveredIp = result.address;
    const currentIp = this.api?.address;

    // Filter out if no address
    if (!discoveredIp) return true;

    // Check if we are seeing the same IP (expected normal behavior, just return)
    if (discoveredIp === currentIp) return true;

    this.log('onDiscoveryResult', discoveryResult);

    // Check cache to prevent spamming verification
    const lastCheck = this.discoveryCache.get(discoveredIp);
    const now = Date.now();
    const COOLDOWN = 300000; // 5 minutes

    if (lastCheck && (now - lastCheck) < COOLDOWN) {
      this.log(`Skipping discovery verification for ${discoveredIp} (cached recently).`);
      return true;
    }

    this.log(`Potential IP change detected from ${currentIp} to ${discoveredIp}. Verifying device identity...`);
    this.verifyAndUpdateIp(discoveredIp).catch((err) => this.error(`Failed to verify IP update: ${err.message}`));

    return true;
  }

  private async verifyAndUpdateIp(newIp: string) {
    // Mark this IP as checked now
    this.discoveryCache.set(newIp, Date.now());

    try {
      const tempApi = new TWC(newIp);
      const version = await tempApi.getVersion();

      if (!version) {
        throw new Error('Could not fetch version from discovered device.');
      }

      const discoveredSerial = version.getSerialNumber();
      // Use data.id (immutable from pairing) as primary source, fallback to settings
      const storedSerial = this.getData().id || this.getSetting(Settings.SERIAL_NUMBER);

      if (discoveredSerial && storedSerial && discoveredSerial === storedSerial) {
        this.log(`${Log.IDENTITY_VERIFIED}${discoveredSerial}). Updating IP to ${newIp}.`);

        // Update API and Store
        this.api = new TWC(newIp);
        await this.setStoreValue(Settings.IP, newIp);

        // Verification successful, so we are now using this IP.
        // We can technically clear it from cache or keep it.
        // If we clear it, repeated discovery of this SAME IP will hit "if (discoveredIp === currentIp)" check above, so it's fine.
        // But if it fails, the cache prevents retries.

        // Optionally update settings to reflect new network state immediately
        this.getChargerState().catch(this.error);
      } else {
        this.log(`IP Verification Failed: Serial Number Mismatch. Discovered: ${discoveredSerial}, Expected: ${storedSerial}. Ignoring update.`);
      }
    } catch (err: any) {
      this.error(`Error during IP verification for ${newIp}`, err);
    }
  }

  arrayToString(arr: string[]): string {
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
  private determineEvseState(vit: TWCVitals): { state: HomeyEVChargerChargingState, status: string, power: number } {
    let state: HomeyEVChargerChargingState = HomeyEVChargerChargingState.PluggedOut;
    let status = ChargeStatus.ERROR;
    let power = 0;

    const evseState = vit.getEvseStateV2();

    switch (evseState) {
      case EVSEState.Charging:
      case EVSEState.ChargePowerReduced:
        state = HomeyEVChargerChargingState.PluggedInCharging;
        status = ChargeStatus.CHARGING;
        power = this.calculatePower(vit);
        break;
      case EVSEState.ReadyToChargeWaitingOnVehicle: // Ready, Waiting for vehicle
      case EVSEState.ConnectedReady: // Ready, Connected
        state = HomeyEVChargerChargingState.PluggedInPaused;
        status = ChargeStatus.CONNECTED;
        break;
      case EVSEState.ConnectedFinishedCharging:
        state = HomeyEVChargerChargingState.PluggedIn;
        status = ChargeStatus.FINISHED;
        break;
      case EVSEState.ConnectedFullyCharged:
        state = HomeyEVChargerChargingState.PluggedIn;
        status = ChargeStatus.FINISHED;
        break;
      case EVSEState.ConnectedNegotiating:
      case EVSEState.ConnectedNotReady:
        state = HomeyEVChargerChargingState.PluggedIn;
        status = ChargeStatus.CONNECTED;
        break;
      case EVSEState.NoVehicleConnected:
        state = HomeyEVChargerChargingState.PluggedOut;
        status = ChargeStatus.DISCONNECTED;
        break;
      default:
        state = HomeyEVChargerChargingState.PluggedOut;
        status = ChargeStatus.ERROR; // Or unknown
    }
    return { state, status, power };
  }

  async getChargerState() {
    if (this.api === null) return;

    this.totalPollCount++;
    let success = false;
    let errorMsg = 'Unknown error';
    const settingsUpdates: Record<string, any> = {};

    try {
      // --- Version Info ---
      try {
        const ver = await this.api.getVersion();
        // Verify identity before fetching sensitive data
        if (!(await this.verifyDeviceIdentity(ver))) {
          errorMsg = Log.IDENTITY_FAILED;
          this.error(errorMsg);
          // Don't return — let the poll cycle finish so next poll is always scheduled
        } else if (ver) {
          success = true;
          Object.assign(settingsUpdates, {
            firmware_version: ver.getFirmwareVersion(),
            git_branch: ver.getGitBranch(),
            part_number: ver.getPartNumber(),
            serial_number: ver.getSerialNumber(),
            web_service: ver.getWebService(),
          });
        }
      } catch (e: any) {
        errorMsg = e.message || Log.ERR_VERSION;
        this.error(Log.ERR_SET_VERSION, e);
      }

      // --- Wifi Status ---
      try {
        const wifi = await this.api.getWifiStatus();
        if (wifi) {
          success = true;
          Object.assign(settingsUpdates, {
            wifi_ssid: this.decodeSsid(wifi.getWifiSsid()),
            wifi_signal_strength: `${wifi.getWifiSignalStrength()}${Unit.PERCENT}`,
            wifi_rssi: `${wifi.getWifiRssi()}${Unit.DECIBEL}`,
            wifi_snr: `${wifi.getWifiSnr()}${Unit.DECIBEL}`,
            wifi_connected: wifi.getWifiConnected() ? BooleanState.YES : BooleanState.NO,
            wifi_infra_ip: wifi.getWifiInfraIp(),
            internet: wifi.getInternet() ? BooleanState.YES : BooleanState.NO,
            wifi_mac: wifi.getWifiMac(),
          });

          await this.setCapabilityValue(Capability.MEASURE_SIGNAL_STRENGTH, parseInt(wifi.getWifiRssi(), 10) || -100).catch(this.error);
          await this.setCapabilityValue(Capability.MEASURE_SNR, parseInt(wifi.getWifiSnr(), 10) || 0).catch(this.error);
        }
      } catch (e: any) {
        errorMsg = e.message || Log.ERR_WIFI;
        this.error(Log.ERR_SET_WIFI, e);
      }

      // --- Lifetime Stats ---
      try {
        const life = await this.api.getLifetime();
        if (life) {
          success = true;
          const energyWh = life.getEnergyWh();
          const totalKwh = energyWh / 1000;
          Object.assign(settingsUpdates, {
            contactor_cycles: life.getContactorCycles(),
            contactor_cycles_loaded: life.getContactorCyclesLoaded(),
            alert_count: life.getAlertCount(),
            thermal_foldbacks: life.getThermalFoldbacks(),
            avg_startup_temp: life.getAvgStartupTemp(),
            charge_starts: life.getChargeStarts(),
            enrgy_wh: this.humanizeEnergy(energyWh),
            connector_cycles: life.getConnectorCycles(),
            lifetime_uptime_s: this.humanizeDuration(life.getUptimeS()),
            charging_time_s: this.humanizeDuration(life.getChargingTimeS()),
          });
          await this.setCapabilityValue(Capability.METER_POWER_TOTAL, totalKwh).catch(this.error);
          if (this.hasCapability(Capability.METER_POWER)) {
            await this.setCapabilityValue(Capability.METER_POWER, totalKwh).catch(this.error);
          }
        }
      } catch (e: any) {
        errorMsg = e.message || Log.ERR_LIFETIME;
        this.error(Log.ERR_SET_LIFETIME, e);
      }

      // --- Vitals (Capabilities) ---
      try {
        const vit = await this.api.getVitals();
        if (vit) {
          success = true;
          // 1. Update Standard Capabilities via Mapping
          for (const m of MAPPINGS) {
            try {
              if (m.condition && !m.condition(vit)) continue;
              const val = m.valueGetter(vit, this);
              await this.setCapabilityValue(m.capability, m.transform ? m.transform(val) : val);
            } catch (err: any) {
              // Silent fail for individual capability updates is acceptable, but logging is good
              this.log(`${Log.ERR_SET_CAPABILITY}${m.capability}:`, err.message || err);
            }
          }

          // 2. Handle Complex State Logic (Status & Charging State)
          const { state, status, power } = this.determineEvseState(vit);

          await this.setCapabilityValue(Capability.MEASURE_TWC_POWER_VEHICLE, power).catch(this.error);
          if (this.hasCapability(Capability.MEASURE_POWER)) {
            await this.setCapabilityValue(Capability.MEASURE_POWER, power).catch(this.error);
          }

          const currentStatus = this.getCapabilityValue(Capability.ALARM_TWC_STATE_EVSE);
          if (currentStatus !== status) {
            this.log(`${Log.STATUS_CHANGED}${currentStatus} -> ${status}`);
            await this.setCapabilityValue(Capability.ALARM_TWC_STATE_EVSE, status).catch(this.error);
            // Trigger flow
            if (this._charging_status_changed) {
              this._charging_status_changed.trigger(this, { status }, {}).catch(this.error);
            }
          }

          const currentStateV2 = this.getCapabilityValue(Capability.EVCHARGER_CHARGING_STATE);
          if (currentStateV2 !== state) {
            this.log(`${Log.CHARGING_STATE_CHANGED}${currentStateV2} -> ${state}`);
            await this.setCapabilityValue(Capability.EVCHARGER_CHARGING_STATE, state).catch(this.error);
          }

          // 3. Update Vitals Settings
          Object.assign(settingsUpdates, {
            session_s: this.humanizeDuration(vit.getSessionS()),
            vitals_uptime_s: this.humanizeDuration(vit.getUptimeS()),
            evse_state: vit.getEvseState().toString(),
            config_status: vit.getConfigStatus().toString(),
            current_alerts: this.arrayToString(vit.getCurrentAlerts()),
            evse_not_ready_reasons: this.arrayToString(vit.getEvseNotReadyReasons() as any),
          });

        }
      } catch (e: any) {
        errorMsg = e.message || Log.ERR_VITALS;
        this.error(Log.ERR_VITALS, e);
      }

      // --- Update debug tracking ---
      const now = new Date().toISOString();
      if (success) {
        this.lastSuccessfulPoll = now;
        this.consecutiveFailures = 0;
      } else {
        this.lastFailedPoll = now;
        this.lastError = errorMsg;
        this.consecutiveFailures++;
        this.totalFailureCount++;
      }

      // --- Add debug info to settings ---
      Object.assign(settingsUpdates, {
        [Debug.POLL_STATUS]: success
          ? PollStatus.OK
          : `${PollStatus.FAILING} (${this.consecutiveFailures} consecutive)`,
        [Debug.LAST_SUCCESS]: this.lastSuccessfulPoll,
        [Debug.LAST_FAILURE]: this.lastFailedPoll,
        [Debug.LAST_ERROR]: this.lastError,
        [Debug.POLL_COUNT]: this.totalPollCount.toString(),
        [Debug.FAILURE_COUNT]: this.totalFailureCount.toString(),
        [Debug.IP_ADDRESS]: this.api?.address || 'Unknown',
      });

      // --- Apply Batched Settings (Only if changed) ---
      if (Object.keys(settingsUpdates).length > 0) {
        try {
          const currentSettings = this.getSettings();
          const changedSettings: Record<string, any> = {};

          for (const [key, value] of Object.entries(settingsUpdates)) {
            if (currentSettings[key] !== value) {
              changedSettings[key] = value;
            }
          }

          if (Object.keys(changedSettings).length > 0) {
            await this.setSettings(changedSettings);
          }
        } catch (e: any) {
          this.error(Log.ERR_APPLY_SETTINGS, e);
        }
      }

      // --- Availability handling ---
      if (success) {
        await this.setAvailable().catch(this.error);
      } else {
        this.error(`${Log.POLL_FAILED}${errorMsg}. Marking device unavailable.`);
        await this.setUnavailable(errorMsg).catch(this.error);
      }

    } catch (e: any) {
      // Catch-all for any unexpected errors — ensures polling never dies
      this.error(Log.UNEXPECTED_ERROR, e);
    } finally {
      // --- Schedule next poll (ALWAYS runs, even after errors) ---
      const settings = this.getSettings();
      const interval = settings.polling_interval || 60;
      this.cleanupPolling();
      this.pollIntervals.push(setTimeout(() => {
        this.getChargerState();
      }, interval * 1000));
    }
  }
}
module.exports = TWCDevice;
