import { TWCVersion } from './version';
import { TWCLifetime } from './lifetime';
import { TWCVitals } from './vitals';
import { TWCWifiStatus } from './wifi_status';
import { ApiEndpoint, ErrorMsg } from './constants';

const NAN_REGEX = /:nan/g;
const NAN_REPLACEMENT = ':0';

export class TWC {

  address: string;
  private readonly vitalsUrl: string;
  private readonly wifiStatusUrl: string;
  private readonly lifetimeUrl: string;
  private readonly versionUrl: string;

  constructor(address: string) {
    this.address = address;
    const baseUrl = `http://${address}/api/1/`;
    this.vitalsUrl = `${baseUrl}${ApiEndpoint.VITALS}`;
    this.wifiStatusUrl = `${baseUrl}${ApiEndpoint.WIFI_STATUS}`;
    this.lifetimeUrl = `${baseUrl}${ApiEndpoint.LIFETIME}`;
    this.versionUrl = `${baseUrl}${ApiEndpoint.VERSION}`;
  }

  private async fetch(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  async getVitals(): Promise<TWCVitals | null> {
    try {
      const res = await this.fetch(this.vitalsUrl);
      if (!res.ok) throw Error(`${res.status} - ${res.statusText}`);
      return new TWCVitals(await res.json());
    } catch (e: any) {
      console.error(`${ErrorMsg.TWC_ERROR}[getVitals]: ${e.message}`);
      return null;
    }
  }

  async getWifiStatus(): Promise<TWCWifiStatus | null> {
    try {
      const res = await this.fetch(this.wifiStatusUrl);
      if (!res.ok) {
        console.error(res.status, res.statusText);
        throw Error(`${res.status} - ${res.statusText}`);
      }
      return new TWCWifiStatus(await res.json());
    } catch (e: any) {
      console.error(`${ErrorMsg.TWC_ERROR}[getWifiStatus]: ${e.message}`);
      return null;
    }
  }

  async getLifetime(): Promise<TWCLifetime | null> {
    try {
      const res = await this.fetch(this.lifetimeUrl);
      if (!res.ok) throw Error(`${res.status} - ${res.statusText}`);
      let text = await res.text();
      text = text.replace(NAN_REGEX, NAN_REPLACEMENT);
      return new TWCLifetime(JSON.parse(text));
    } catch (e: any) {
      console.error(`${ErrorMsg.TWC_ERROR}[getLifetime]: ${e.message}`);
      return null;
    }
  }

  async getVersion(): Promise<TWCVersion | null> {
    try {
      const res = await this.fetch(this.versionUrl);
      if (!res.ok) throw Error(`${res.status} - ${res.statusText}`);
      return new TWCVersion(await res.json());
    } catch (e: any) {
      console.error(`${ErrorMsg.TWC_ERROR}[getVersion]: ${e.message}`);
      return null;
    }
  }
}
