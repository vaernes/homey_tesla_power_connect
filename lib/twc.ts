import { TWCVersion } from './version';
import { TWCLifetime } from './lifetime';
import { TWCVitals } from './vitals';
import { TWCWifiStatus } from './wifi_status';

export class TWC {

  address: string;
  constructor(address: string) {
    this.address = address;
  }

  private async fetch(endpoint: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      return await fetch(`http://${this.address}/api/1/${endpoint}`, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }


  async getVitals(): Promise<TWCVitals | null> {
    try {
      const res = await this.fetch('vitals');
      if (!res.ok) throw Error(`${res.status} - ${res.statusText}`);
      return new TWCVitals(await res.json());
    } catch (e: any) {
      console.error(`TWC Error [getVitals]: ${e.message}`);
      return null;
    }
  }

  async getWifiStatus(): Promise<TWCWifiStatus | null> {
    try {
      const res = await this.fetch('wifi_status');
      if (!res.ok) {
        console.error(res.status, res.statusText);
        throw Error(`${res.status} - ${res.statusText}`);
      }
      return new TWCWifiStatus(await res.json());
    } catch (e: any) {
      console.error(`TWC Error [getWifiStatus]: ${e.message}`);
      return null;
    }
  }

  async getLifetime(): Promise<TWCLifetime | null> {
    try {
      const res = await this.fetch('lifetime');
      if (!res.ok) throw Error(`${res.status} - ${res.statusText}`);
      let text = await res.text();
      text = text.replace(':nan', ':0');
      return new TWCLifetime(JSON.parse(text));
    } catch (e: any) {
      console.error(`TWC Error [getLifetime]: ${e.message}`);
      return null;
    }
  }

  async getVersion(): Promise<TWCVersion | null> {
    try {
      const res = await this.fetch('version');
      if (!res.ok) throw Error(`${res.status} - ${res.statusText}`);
      return new TWCVersion(await res.json());
    } catch (e: any) {
      console.error(`TWC Error [getVersion]: ${e.message}`);
      return null;
    }
  }
}
