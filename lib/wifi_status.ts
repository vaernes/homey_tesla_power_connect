export class TWCWifiStatus {
  wifi_ssid!: string;
  wifi_signal_strength!: number;
  wifi_rssi!: number;
  wifi_snr!: number;
  wifi_connected!: boolean;
  wifi_infra_ip!: string;
  internet!: boolean;
  wifi_mac!: string;

  public constructor(json: any) {
    if (!json) return;
    this.wifi_ssid = json.wifi_ssid;
    this.wifi_signal_strength = json.wifi_signal_strength;
    this.wifi_rssi = json.wifi_rssi;
    this.wifi_snr = json.wifi_snr;
    this.wifi_connected = json.wifi_connected;
    this.wifi_infra_ip = json.wifi_infra_ip;
    this.internet = json.internet;
    this.wifi_mac = json.wifi_mac;
  }

  public getWifiSsid(): string {
    return (this.wifi_ssid || '').toString();
  }

  public getWifiSignalStrength(): string {
    return (this.wifi_signal_strength || 0).toString();
  }

  public getWifiRssi(): string {
    return (this.wifi_rssi || 0).toString();
  }

  public getWifiSnr(): string {
    return (this.wifi_snr || 0).toString();
  }

  public getWifiConnected(): boolean {
    return !!this.wifi_connected;
  }

  public getWifiInfraIp(): string {
    return (this.wifi_infra_ip || '').toString();
  }

  public getInternet(): boolean {
    return !!this.internet;
  }

  public getWifiMac(): string {
    return (this.wifi_mac || '').toString();
  }
}
