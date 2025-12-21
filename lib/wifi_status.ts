export class wifi_status {
  wifi_ssid!: string;
  wifi_signal_strength!: number;
  wifi_rssi!: number;
  wifi_snr!: number;
  wifi_connected!: boolean;
  wifi_infra_ip!: string;
  internet!: boolean;
  wifi_mac!: string;

  public constructor(json: any) {
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
    if (this.wifi_ssid === undefined) {
      return '';
    }
    return this.wifi_ssid.toString();
  }

  public getWifiSignalStrength(): string {
    if (this.wifi_signal_strength === undefined) {
      return '';
    }
    return this.wifi_signal_strength.toString();
  }

  public getWifiRssi(): string {
    if (this.wifi_rssi === undefined) {
      return '';
    }
    return this.wifi_rssi.toString();
  }

  public getWifiSnr(): string {
    if (this.wifi_snr === undefined) {
      return '';
    }
    return this.wifi_snr.toString();
  }

  public getWifiConnected(): boolean {
    if (this.wifi_connected === undefined) {
      return false;
    }
    return this.wifi_connected;
  }

  public getWifiInfraIp(): string {
    if (this.wifi_infra_ip === undefined) {
      return '';
    }
    return this.wifi_infra_ip.toString();
  }

  public getInternet(): boolean {
    if (this.internet === undefined) {
      return false;
    }
    return this.internet;
  }

  public getWifiMac(): string {
    if (this.wifi_mac === undefined) {
      return '';
    }
    return this.wifi_mac.toString();
  }
}
