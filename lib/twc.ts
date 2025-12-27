import { version } from './version';
import { lifetime } from './lifetime';
import { vitals } from './vitals';
import { wifi_status } from './wifi_status';

export class TWC {

  address: string;
  constructor(address: string) {
    this.address = address;
  }

  async getVitals(): Promise<vitals | null> {
    return fetch(`http://${this.address}/api/1/vitals`)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw Error(`${res.status} - ${res.statusText}`);
      })
      .then((res) => {
        return new vitals(res);
      })
      .catch((e) => {
        console.error(`TWC Error [getVitals]: ${e.message}`);
        return null;
      });
  }

  async getWifiStatus(): Promise<wifi_status | null> {
    return fetch(`http://${this.address}/api/1/wifi_status`)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        console.error(res.status, res.statusText);
        throw Error(`${res.status} - ${res.statusText}`);

      })
      .then((res) => {
        return new wifi_status(res);
      })
      .catch((e) => {
        console.error(`TWC Error [getWifiStatus]: ${e.message}`);
        return null;
      });
  }

  async getLifetime(): Promise<lifetime | null> {
    return fetch(`http://${this.address}/api/1/lifetime`)
      .then((res) => {
        if (res.ok) {
          return res.text();
        }
        throw Error(`${res.status} - ${res.statusText}`);
      })
      .then((res) => {
        res = res.replace(':nan', ':0');
        return new lifetime(JSON.parse(res));
      })
      .catch((e) => {
        console.error(`TWC Error [getLifetime]: ${e.message}`);
        return null;
      });
  }

  async getVersion(): Promise<version | null> {
    return fetch(`http://${this.address}/api/1/version`)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw Error(`${res.status} - ${res.statusText}`);

      })
      .then((res) => {
        return new version(res);
      })
      .catch((e) => {
        console.error(`TWC Error [getVersion]: ${e.message}`);
        return null;
      });
  }
}
