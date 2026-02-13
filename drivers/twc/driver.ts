import Homey from 'homey';
import PairSession from 'homey/lib/PairSession';

import { TWC } from '../../lib/twc';

export class TWCDriver extends Homey.Driver {

  async onInit() {
    this.log('Tesla Wall Connector driver has been initialized');

    // Check for already discovered devices immediately on startup
    const strategy = this.getDiscoveryStrategy();
    const results = strategy.getDiscoveryResults();
    this.log('onInit: Current Discovery Results:', JSON.stringify(results, null, 2));

    this.registerFlows();
  }

  private registerFlows() {
    this.log('Registering flow card listeners...');

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



  async onPair(session: PairSession) {
    this.log('onPair called');

    this.log('Registering list_devices handler...');
    session.setHandler('list_devices', async () => {
      this.log('pair: list_devices handler triggered');

      const devices = [];
      const seenIds = new Set();

      // 1. Handle discovery results
      const discoveryStrategy = this.getDiscoveryStrategy();
      let discoveryResults = discoveryStrategy.getDiscoveryResults();
      this.log(`Initial discovery results count: ${Object.keys(discoveryResults).length}`);

      // Wait if no results found
      let attempts = 0;
      while (Object.keys(discoveryResults).length === 0 && attempts < 10) {
        this.log(`No discovery results yet, attempt ${attempts + 1}/10...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        discoveryResults = discoveryStrategy.getDiscoveryResults();
        attempts++;
      }

      const resultsList = Array.isArray(discoveryResults) ? discoveryResults : Object.values(discoveryResults);
      this.log(`Found ${resultsList.length} discovery results to probe`);

      for (const discoveryResult of resultsList as any[]) {
        try {
          // If the discovery result has no address, skip it
          if (!discoveryResult.address) {
            this.log('Skipping discovery result without address', discoveryResult);
            continue;
          }

          // Filter by model if available (exclude Powerwalls etc.)
          if (discoveryResult.txt && discoveryResult.txt.model) {
            const model = discoveryResult.txt.model.toLowerCase();
            // Simple check: 'wc' is present in both 'wc3' (Gen 3) and 'uwc' (Universal)
            if (!model.includes('wc')) {
              this.log(`Skipping non-Wall Connector device (model: ${model}) at ${discoveryResult.address}`);
              continue;
            }
          }

          this.log(`Probing discovered device at ${discoveryResult.address}...`);
          const api = new TWC(discoveryResult.address);
          const result = await api.getVersion();

          if (result && result.getSerialNumber()) {
            const id = result.getSerialNumber();
            const firmware = result.getFirmwareVersion();
            this.log(`Device found: ${id} at ${discoveryResult.address} (Firmware: ${firmware})`);
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
            this.log(`Device at ${discoveryResult.address} did not return a valid serial number.`);
          }
        } catch (err: any) {
          this.error(`Failed to probe discovered device at ${discoveryResult.address}`, err);
        }
      }

      if (devices.length === 0) {
        throw new Error(this.homey.__('pair.twc.error_device_not_found'));
      }

      this.log('Returning devices:', devices);
      return devices;
    });

    session.setHandler('manual_add', async (data) => {
      this.log(`pair: manual_add triggered for address: ${data.address}`);
      const { address } = data;
      const api = new TWC(address);
      try {
        this.log(`Probing manual address ${address}...`);
        const result = await api.getVersion();
        if (result && result.getSerialNumber()) {
          const id = result.getSerialNumber();
          const firmware = result.getFirmwareVersion();
          this.log(`Success: Found TWC ${id} at ${address} (Firmware: ${firmware})`);
          return {
            name: `TWC Gen3 (${address})`,
            data: {
              id,
              ip: address,
            },
          };
        } else {
          this.error(`Manual probe failed: Device at ${address} did not return a valid serial number.`);
          throw new Error('Device found but did not return a valid serial number.');
        }
      } catch (err: any) {
        this.error(`Failed to manually add device at ${address}. Error: ${err.message}`, err);
        throw new Error(`Could not connect to device at ${address}: ${err.message}`);
      }
    });
  }
}
module.exports = TWCDriver;
