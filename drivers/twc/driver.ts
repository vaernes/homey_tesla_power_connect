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
  }

  async onDiscovery(discoveryResult: any) {
    this.log('onDiscovery called', JSON.stringify(discoveryResult, null, 2));
    return discoveryResult;
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
      this.log('discoveryStrategy initialized');

      let attempts = 0;
      let discoveryResults = discoveryStrategy.getDiscoveryResults();

      this.log('Initial discoveryResults type:', typeof discoveryResults);
      this.log('Initial discoveryResults:', JSON.stringify(discoveryResults, null, 2));

      // Wait if no results found
      while (Object.keys(discoveryResults).length === 0 && attempts < 15) {
        this.log(`No devices found yet, waiting... (Attempt ${attempts + 1}/15)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        discoveryResults = discoveryStrategy.getDiscoveryResults();
        this.log(`Attempt ${attempts + 1} discoveryResults:`, JSON.stringify(discoveryResults, null, 2));
        attempts++;
      }

      const resultsList = Array.isArray(discoveryResults) ? discoveryResults : Object.values(discoveryResults);

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
            this.log(`Device found: ${id} at ${discoveryResult.address}`);
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
  }
}
module.exports = TWCDriver;
