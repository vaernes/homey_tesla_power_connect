interface VersionData {
  firmware_version?: string;
  git_branch?: string;
  part_number?: string;
  serial_number?: string;
  web_service?: string;
}

export class TWCVersion {
  private readonly data: VersionData;

  public constructor(json: any) {
    this.data = json || {};
  }

  public getFirmwareVersion(): string {
    return (this.data.firmware_version || '').toString();
  }

  public getGitBranch(): string {
    return (this.data.git_branch || '').toString();
  }

  public getPartNumber(): string {
    return (this.data.part_number || '').toString();
  }

  public getSerialNumber(): string {
    return (this.data.serial_number || '').toString();
  }

  public getWebService(): string {
    return (this.data.web_service || '').toString();
  }
}
