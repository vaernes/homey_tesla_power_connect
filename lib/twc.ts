import { TWCVersion } from './version';
import { TWCLifetime } from './lifetime';
import { TWCVitals } from './vitals';
import { TWCWifiStatus } from './wifi_status';

export class TWC {

  address: string;
  constructor(address: string) {
    this.address = address;
  }

  private async fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  }

  async getVitals(): Promise<TWCVitals | null> {
    return this.fetchWithTimeout(`http://${this.address}/api/1/vitals`)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw Error(`${res.status} - ${res.statusText}`);
      })
      .then((res) => {
        return new TWCVitals(res);
      })
      .catch((e) => {
        console.error(`TWC Error [getVitals]: ${e.message}`);
        return null;
      });
  }

  async getWifiStatus(): Promise<TWCWifiStatus | null> {
    return this.fetchWithTimeout(`http://${this.address}/api/1/wifi_status`)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        console.error(res.status, res.statusText);
        throw Error(`${res.status} - ${res.statusText}`);

      })
      .then((res) => {
        return new TWCWifiStatus(res);
      })
      .catch((e) => {
        console.error(`TWC Error [getWifiStatus]: ${e.message}`);
        return null;
      });
  }

  async getLifetime(): Promise<TWCLifetime | null> {
    return this.fetchWithTimeout(`http://${this.address}/api/1/lifetime`)
      .then((res) => {
        if (res.ok) {
          return res.text();
        }
        throw Error(`${res.status} - ${res.statusText}`);
      })
      .then((res) => {
        res = res.replace(':nan', ':0');
        return new TWCLifetime(JSON.parse(res));
      })
      .catch((e) => {
        console.error(`TWC Error [getLifetime]: ${e.message}`);
        return null;
      });
  }

  async getVersion(): Promise<TWCVersion | null> {
    return this.fetchWithTimeout(`http://${this.address}/api/1/version`)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw Error(`${res.status} - ${res.statusText}`);

      })
      .then((res) => {
        return new TWCVersion(res);
      })
      .catch((e) => {
        console.error(`TWC Error [getVersion]: ${e.message}`);
        return null;
      });
  }
}
