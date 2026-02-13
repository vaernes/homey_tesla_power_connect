import Homey from 'homey';
import { TWC } from '../../lib/twc';
import { TWCVitals } from '../../lib/vitals';
import { TWCVersion } from '../../lib/version';
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
  valueGetter: (vit: TWCVitals, device: TWCDevice) => any;
  transform?: (val: any) => any;
  condition?: (vit: TWCVitals) => boolean;
}

const MAPPINGS: CapabilityMapping[] = [
  { capability: 'meter_power.vehicle', valueGetter: (v) => v.getSessionEnergyWh() / 1000 },
  { capability: 'measure_current.vehicle', valueGetter: (v) => v.getVehicleCurrentA() },
  { capability: 'measure_current.a', valueGetter: (v) => v.getCurrentA_a() },
  { capability: 'measure_current.b', valueGetter: (v) => v.getCurrentB_a() },
  { capability: 'measure_current.c', valueGetter: (v) => v.getCurrentC_a() },
  { capability: 'measure_current.n', valueGetter: (v) => v.getCurrentN_a() },
  { capability: 'measure_twc_voltage.a', valueGetter: (v, d) => v.getVoltageA_v() + d.getVoltageAdjustment() },
  { capability: 'measure_twc_voltage.b', valueGetter: (v, d) => v.getVoltageB_v() + d.getVoltageAdjustment() },
  { capability: 'measure_twc_voltage.c', valueGetter: (v, d) => v.getVoltageC_v() + d.getVoltageAdjustment() },
  { capability: 'measure_temperature.handle', valueGetter: (v) => v.getHandleTempC() },
  { capability: 'measure_temperature.mcu', valueGetter: (v) => v.getMcuTempC() },
  { capability: 'measure_temperature.pcba', valueGetter: (v) => v.getPcbaTempC() },
  { capability: 'measure_temperature.charger', valueGetter: (v) => (v.getMcuTempC() + v.getPcbaTempC()) / 2 },
  { capability: 'measure_twc_voltage.grid', valueGetter: (v, d) => v.getGridV() + d.getVoltageAdjustment() },
  { capability: 'measure_frequency.grid', valueGetter: (v) => v.getGridHz() },
  { capability: 'measure_twc_voltage.relay_coil_v', valueGetter: (v) => v.getRelayCoilV() },
  { capability: 'measure_twc_voltage.prox_v', valueGetter: (v) => v.getProxV() },
  { capability: 'measure_twc_voltage.pilot_high_v', valueGetter: (v) => v.getPilotHighV() },
  { capability: 'measure_twc_voltage.pilot_low_v', valueGetter: (v) => v.getPilotLowV() },
  { capability: 'evse_state', valueGetter: (v) => getEVSEStateString(v.getEvseState()) },
  { capability: 'measure_evse_state', valueGetter: (v) => v.getEvseState() },
  { capability: 'alarm_twc_state.contactor', valueGetter: (v) => (v.getContactorClosed() ? 'Closed' : 'Open') },
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
    this.log(`Initializing TWC device: ${this.getName()}...`);
    let address = this.getData().ip;
    const storedAddress = this.getStoreValue('ip');
    if (storedAddress) {
      address = storedAddress;
    } else {
      // Initialize store with data ip if missing
      await this.setStoreValue('ip', address).catch(this.error);
    }

    this.api = new TWC(address);

    const settings = this.getSettings();
    const interval = settings.polling_interval || 60;
    this.cleanupPolling();
    this.pollIntervals.push(setTimeout(() => {
      this.getChargerState();
    }, 1000));

    await this.ensureCapabilities([
      'meter_power.total',
      'meter_power',
      'measure_power',
      'evcharger_charging_state',
      'evse_state',
      'measure_evse_state',
      'measure_twc_power.vehicle',
      'meter_power.vehicle',
      'alarm_twc_state.evse',
      'measure_current.vehicle',
      'measure_current.a',
      'measure_current.b',
      'measure_current.c',
      'measure_current.n',
      'measure_twc_voltage.a',
      'measure_twc_voltage.b',
      'measure_twc_voltage.c',
      'measure_temperature.handle',
      'measure_temperature.mcu',
      'measure_temperature.pcba',
      'measure_temperature.charger',
      'measure_twc_voltage.grid',
      'measure_frequency.grid',
      'measure_twc_voltage.relay_coil_v',
      'measure_twc_voltage.prox_v',
      'measure_twc_voltage.pilot_high_v',
      'measure_twc_voltage.pilot_low_v',
      'alarm_twc_state.contactor'
    ]);

    this._charging_status_changed = this.homey.flow.getDeviceTriggerCard('charger_status_changed');
    const verified = await this.verifyDeviceIdentity();
    if (verified) {
      this.log(`TWC device initialized successfully. Firmware: ${settings.firmware_version || 'unknown'}`);
    } else {
      this.error('TWC device initialization failed: Serial Number Mismatch or device unreachable.');
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

      this.error(`Serial Mismatch! Expected: ${storedSerial}, Found: ${discoveredSerial} at ${this.api.address}`);
      await this.setUnavailable(`Serial Mismatch. Expected: ${storedSerial}, Found: ${discoveredSerial}`).catch(this.error);
      return false;

    } catch (e) {
      this.error('Error verifying device identity:', e);
      return false;
    }
  }

  async onSettings(event: { oldSettings: object, newSettings: any, changedKeys: string[] }): Promise<string | void> {
    this.log('Settings changed');
    if (event.changedKeys.indexOf('polling_interval') > -1) {
      this.cleanupPolling();
      this.log(`Change poll interval ${event.newSettings.polling_interval}`);
      this.pollIntervals.push(setTimeout(() => {
        this.getChargerState();
      }, event.newSettings.polling_interval * 1000));
    }
    if (event.changedKeys.indexOf('voltage_adjustment') > -1) {
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
    if (months > 0) parts.push(`${months}mo`);
    if (weeks > 0) parts.push(`${weeks}w`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (parts.length < 3 && minutes > 0) parts.push(`${minutes}m`);
    if (parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ') || '0s';
  }

  humanizeEnergy(wh: number): string {
    if (wh < 1000) return `${wh} Wh`;
    const kwh = wh / 1000;
    if (kwh < 1000) return `${kwh.toFixed(1)} kWh`;
    const mwh = kwh / 1000;
    return `${mwh.toFixed(2)} MWh`;
  }

  getVoltageAdjustment(): number {
    try {
      return this.getSetting('voltage_adjustment') || 0;
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

  private discoveryCache: Map<string, number> = new Map();

  onDiscoveryResult(discoveryResult: Homey.DiscoveryResult): boolean {
    this.log('onDiscoveryResult', discoveryResult);
    const result = discoveryResult as any;
    const discoveredIp = result.address;
    const currentIp = this.api?.address;

    // Filter out if no address
    if (!discoveredIp) return true;

    // Check if we are seeing the same IP (expected normal behavior, just return)
    if (discoveredIp === currentIp) return true;

    // Check cache to prevent spamming verification
    const lastCheck = this.discoveryCache.get(discoveredIp);
    const now = Date.now();
    const COOLDOWN = 300000; // 5 minutes

    if (lastCheck && (now - lastCheck) < COOLDOWN) {
      this.log(`Skipping discovery verification for ${discoveredIp} (cached recently).`);
      return true;
    }

    this.log(`Potential IP change detected from ${currentIp} to ${discoveredIp}. Verifying device identity...`);
    this.verifyAndUpdateIp(discoveredIp).catch(err => this.error(`Failed to verify IP update: ${err.message}`));

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
      const storedSerial = this.getData().id || this.getSetting('serial_number');

      if (discoveredSerial && storedSerial && discoveredSerial === storedSerial) {
        this.log(`Device identity verified (Serial: ${discoveredSerial}). Updating IP to ${newIp}.`);

        // Update API and Store
        this.api = new TWC(newIp);
        await this.setStoreValue('ip', newIp);

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
          errorMsg = 'Identity verification failed (will retry next cycle)';
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
        errorMsg = e.message || 'Error fetching Version info';
        this.error('Error fetching/setting Version', e);
      }

      // --- Wifi Status ---
      try {
        const wifi = await this.api.getWifiStatus();
        if (wifi) {
          success = true;
          Object.assign(settingsUpdates, {
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
      } catch (e: any) {
        errorMsg = e.message || 'Error fetching Wifi status';
        this.error('Error fetching/setting Wifi status', e);
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
          await this.setCapabilityValue('meter_power.total', totalKwh).catch(this.error);
          if (this.hasCapability('meter_power')) {
            await this.setCapabilityValue('meter_power', totalKwh).catch(this.error);
          }
        }
      } catch (e: any) {
        errorMsg = e.message || 'Error fetching Lifetime stats';
        this.error('Error fetching/setting Lifetime', e);
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
            this.log(`Status changed: ${currentStatus} -> ${status}`);
            await this.setCapabilityValue('alarm_twc_state.evse', status).catch(this.error);
            // Trigger flow
            if (this._charging_status_changed) {
              this._charging_status_changed.trigger(this, { status }, {}).catch(this.error);
            }
          }

          const currentStateV2 = this.getCapabilityValue('evcharger_charging_state');
          if (currentStateV2 !== state) {
            this.log(`Charging state changed: ${currentStateV2} -> ${state}`);
            await this.setCapabilityValue('evcharger_charging_state', state).catch(this.error);
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
        errorMsg = e.message || 'Error fetching Vitals';
        this.error('Error fetching Vitals', e);
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
        debug_poll_status: success
          ? 'OK'
          : `FAILING (${this.consecutiveFailures} consecutive)`,
        debug_last_success: this.lastSuccessfulPoll,
        debug_last_failure: this.lastFailedPoll,
        debug_last_error: this.lastError,
        debug_poll_count: this.totalPollCount.toString(),
        debug_failure_count: this.totalFailureCount.toString(),
        debug_ip_address: this.api?.address || 'Unknown',
      });

      // --- Apply Batched Settings ---
      if (Object.keys(settingsUpdates).length > 0) {
        try {
          await this.setSettings(settingsUpdates);
        } catch (e: any) {
          this.error('Error applying batched settings', e);
        }
      }

      // --- Availability handling ---
      if (success) {
        await this.setAvailable().catch(this.error);
      } else {
        this.error(`Poll cycle failed: ${errorMsg}. Marking device unavailable.`);
        await this.setUnavailable(errorMsg).catch(this.error);
      }

    } catch (e: any) {
      // Catch-all for any unexpected errors — ensures polling never dies
      this.error('Unexpected error in poll cycle:', e);
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
