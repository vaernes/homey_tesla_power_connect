interface WifiStatusData {
  wifi_ssid?: string;
  wifi_signal_strength?: number;
  wifi_rssi?: number;
  wifi_snr?: number;
  wifi_connected?: boolean;
  wifi_infra_ip?: string;
  internet?: boolean;
  wifi_mac?: string;
}

export class TWCWifiStatus {
  private readonly data: WifiStatusData;

  public constructor(json: any) {
    this.data = json || {};
  }

  public getWifiSsid(): string {
    return (this.data.wifi_ssid || '').toString();
  }

  public getWifiSignalStrength(): string {
    return (this.data.wifi_signal_strength || 0).toString();
  }

  public getWifiRssi(): string {
    return (this.data.wifi_rssi || 0).toString();
  }

  public getWifiSnr(): string {
    return (this.data.wifi_snr || 0).toString();
  }

  public getWifiConnected(): boolean {
    return !!this.data.wifi_connected;
  }

  public getWifiInfraIp(): string {
    return (this.data.wifi_infra_ip || '').toString();
  }

  public getInternet(): boolean {
    return !!this.data.internet;
  }

  public getWifiMac(): string {
    return (this.data.wifi_mac || '').toString();
  }
}
