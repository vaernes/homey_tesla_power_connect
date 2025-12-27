import Homey from 'homey';
import PairSession from 'homey/lib/PairSession';
import { isIPV4Address } from 'ip-address-validator';
import { TWC } from '../../lib/twc';

export class TWCDriver extends Homey.Driver {

  async onInit() {
    this.log('Tesla Wall Connector driver has been initialized');
  }

  async onPair(session: PairSession) {

    let address = '';

    session.setHandler('charger_ip_confirmed', async (ipView) => {
      this.log('pair: charger_ip_confirmed');
      address = ipView;
      this.log(address);
      if (isIPV4Address(address)) {
        this.log(address);
        await session.showView('list_devices');
        return true;
      }
      this.log('invalid ip provided');
      return false;
    });

    session.setHandler('add_device', async (data) => {
      if (data.id === 'manual_entry') {
        await session.showView('ip_view');
        return false; // Prevent adding this dummy device
      }
      return data; // Proceed with adding real device
    });

    session.setHandler('list_devices', async () => {
      this.log('pair: list_devices');

      const devices = [];
      const seenIds = new Set();

      // 0. Manual Entry Option
      devices.push({
        name: this.homey.__('pair.twc.manual_entry') || "Enter IP Address Manually...",
        data: {
          id: "manual_entry",
        },
        icon: "/assets/manual.svg" // distinct icon if available, or default
      });

      // 1. Handle discovery results
      const discoveryStrategy = this.getDiscoveryStrategy();
      let discoveryResults = discoveryStrategy.getDiscoveryResults();
      let attempts = 0;

      // Wait only if no address manually entered AND no results found
      while (!address && Object.keys(discoveryResults).length === 0 && attempts < 10) {
        this.log(`No devices found yet, waiting... (Attempt ${attempts + 1}/10)`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        discoveryResults = discoveryStrategy.getDiscoveryResults();
        attempts++;
      }

      this.log('discoveryResults', JSON.stringify(discoveryResults, null, 2));

      const resultsList = Array.isArray(discoveryResults) ? discoveryResults : Object.values(discoveryResults);

      for (const discoveryResult of resultsList as any[]) {
        try {
          // If the discovery result has no address, skip it
          if (!discoveryResult.address) {
            this.log('Skipping discovery result without address', discoveryResult);
            continue;
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

      // 2. Handle manual IP address from ip_view
      if (address) {
        this.log(`Probing manual address: ${address}`);
        try {
          const api = new TWC(address);
          const result = await api.getVersion();
          if (result && result.getSerialNumber()) {
            const id = result.getSerialNumber();
            if (!seenIds.has(id)) {
              devices.push({
                name: `TWC Gen3 (${address})`,
                data: {
                  id,
                  ip: address,
                },
              });
              seenIds.add(id);
            }
          }
        } catch (err) {
          this.error(`Failed to probe manual device at ${address}`, err);
        }
      }

      if (devices.length === 0) {
        // Should not happen as we push manual entry, but safety:
        throw new Error(this.homey.__('pair.twc.error_device_not_found'));
      }

      this.log('Returning devices:', devices);
      return devices;
    });
  }
}
module.exports = TWCDriver;
