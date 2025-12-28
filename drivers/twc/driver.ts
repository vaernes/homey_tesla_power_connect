import Homey from 'homey';
import PairSession from 'homey/lib/PairSession';

import { TWC } from '../../lib/twc';

export class TWCDriver extends Homey.Driver {

  async onInit() {
    this.log('Tesla Wall Connector driver has been initialized');
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

      // Wait if no results found
      let attempts = 0;
      while (Object.keys(discoveryResults).length === 0 && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        discoveryResults = discoveryStrategy.getDiscoveryResults();
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

    session.setHandler('manual_add', async (data) => {
      this.log('pair: manual_add', data);
      const { address } = data;
      const api = new TWC(address);
      try {
        const result = await api.getVersion();
        if (result && result.getSerialNumber()) {
          const id = result.getSerialNumber();
          return {
            name: `TWC Gen3 (${address})`,
            data: {
              id,
              ip: address,
            },
          };
        } else {
          throw new Error('Device found but did not return a valid serial number.');
        }
      } catch (err: any) {
        this.error(`Failed to manually add device at ${address}`, err);
        throw new Error(`Could not connect to device at ${address}: ${err.message}`);
      }
    });
  }
}
module.exports = TWCDriver;
