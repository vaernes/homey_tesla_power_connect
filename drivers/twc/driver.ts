import Homey from 'homey';
import PairSession from 'homey/lib/PairSession';

import { TWC } from '../../lib/twc';
import {
  Flow, Pairing, Translation, Discovery, Capability, DriverLog, ErrorMsg,
} from '../../lib/constants';

export class TWCDriver extends Homey.Driver {

  async onInit() {
    this.log(DriverLog.INIT);

    // Check for already discovered devices immediately on startup
    const strategy = this.getDiscoveryStrategy();
    const results = strategy.getDiscoveryResults();
    this.log('onInit: Current Discovery Results:', JSON.stringify(results, null, 2));

    this.registerFlows();
  }

  private registerFlows() {
    this.log(DriverLog.REGISTER_FLOWS);

    const chargingCondition = this.homey.flow.getConditionCard(Flow.IS_CHARGING);
    chargingCondition.registerRunListener(async (args) => {
      const status = args.device.getCapabilityValue(Capability.ALARM_TWC_STATE_EVSE);
      return status === 'Charging';
    });

    const connectedCondition = this.homey.flow.getConditionCard(Flow.IS_CONNECTED);
    connectedCondition.registerRunListener(async (args) => {
      const status = args.device.getCapabilityValue(Capability.ALARM_TWC_STATE_EVSE);
      return status === 'Connected';
    });
  }

  async onPair(session: PairSession) {
    this.log(DriverLog.ON_PAIR);

    this.log(DriverLog.REGISTER_LIST);
    this.log(DriverLog.REGISTER_LIST);
    session.setHandler(Pairing.LIST_DEVICES, async () => {
      this.log(DriverLog.LIST_TRIGGERED);

      const devices = [];
      const seenIds = new Set();

      // 1. Handle discovery results
      const discoveryStrategy = this.getDiscoveryStrategy();
      let discoveryResults = discoveryStrategy.getDiscoveryResults();
      this.log(`${DriverLog.DISCOVERY_INIT_COUNT}${Object.keys(discoveryResults).length}`);

      // Wait if no results found
      let attempts = 0;
      while (Object.keys(discoveryResults).length === 0 && attempts < 10) {
        this.log(`${DriverLog.DISCOVERY_RETRY}${attempts + 1}/10...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        discoveryResults = discoveryStrategy.getDiscoveryResults();
        attempts++;
      }

      const resultsList = Array.isArray(discoveryResults) ? discoveryResults : Object.values(discoveryResults);
      this.log(`${DriverLog.DISCOVERY_FOUND_COUNT}${resultsList.length} discovery results to probe`);

      for (const discoveryResult of resultsList as any[]) {
        try {
          // If the discovery result has no address, skip it
          if (!discoveryResult.address) {
            this.log(DriverLog.SKIP_NO_ADDR, discoveryResult);
            continue;
          }

          // Filter by model if available (exclude Powerwalls etc.)
          if (discoveryResult.txt && discoveryResult.txt.model) {
            const model = discoveryResult.txt.model.toLowerCase();
            // Simple check: 'wc' is present in both 'wc3' (Gen 3) and 'uwc' (Universal)
            if (!model.includes(Discovery.WC_MODEL_KEY)) {
              this.log(`${DriverLog.SKIP_NON_WC}${model}) at ${discoveryResult.address}`);
              continue;
            }
          }

          this.log(`${DriverLog.PROBING}${discoveryResult.address}...`);
          const api = new TWC(discoveryResult.address);
          const result = await api.getVersion();

          if (result && result.getSerialNumber()) {
            const id = result.getSerialNumber();
            const firmware = result.getFirmwareVersion();
            this.log(`${DriverLog.DEVICE_FOUND}${id} at ${discoveryResult.address} (Firmware: ${firmware})`);
            if (!seenIds.has(id)) {
              devices.push({
                name: `TWC Gen3 (${discoveryResult.address})`,
                data: {
                  id,
                  ip: discoveryResult.address,
                },
              });
              seenIds.add(id);
            }
          } else {
            this.log(`${DriverLog.DEVICE_NO_SERIAL}${discoveryResult.address} did not return a valid serial number.`);
          }
        } catch (err: any) {
          this.error(`${ErrorMsg.PROBE_FAILED}${discoveryResult.address}`, err);
        }
      }

      if (devices.length === 0) {
        throw new Error(this.homey.__(Translation.ERROR_DEVICE_NOT_FOUND));
      }

      this.log(DriverLog.RETURNING_DEVICES, devices);
      return devices;
    });

    session.setHandler(Pairing.MANUAL_ADD, async (data) => {
      this.log(`${DriverLog.MANUAL_TRIGGERED}${data.address}`);
      const { address } = data;
      const api = new TWC(address);
      try {
        this.log(`${DriverLog.PROBING_MANUAL}${address}...`);
        const result = await api.getVersion();
        if (result && result.getSerialNumber()) {
          const id = result.getSerialNumber();
          const firmware = result.getFirmwareVersion();
          this.log(`${DriverLog.MANUAL_SUCCESS}${id} at ${address} (Firmware: ${firmware})`);
          return {
            name: `TWC Gen3 (${address})`,
            data: {
              id,
              ip: address,
            },
          };
        }
        this.error(`${ErrorMsg.MANUAL_NO_SERIAL}${address} did not return a valid serial number.`);
        throw new Error(ErrorMsg.MANUAL_GENERIC);

      } catch (err: any) {
        this.error(`${ErrorMsg.MANUAL_ADD_FAILED}${address}. Error: ${err.message}`, err);
        throw new Error(`${ErrorMsg.CONNECT_FAILED}${address}: ${err.message}`);
      }
    });
  }
}
module.exports = TWCDriver;
