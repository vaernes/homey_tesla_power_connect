export class version {
  firmware_version!: string;
  git_branch!: string;
  part_number!: string;
  serial_number!: string;
  web_service!: string;

  public constructor(json: any) {
    if (!json) return;
    this.firmware_version = json.firmware_version;
    this.git_branch = json.git_branch;
    this.part_number = json.part_number;
    this.serial_number = json.serial_number;
    this.web_service = json.web_service;
  }

  public getFirmwareVersion(): string {
    return (this.firmware_version || '').toString();
  }

  public getGitBranch(): string {
    return (this.git_branch || '').toString();
  }

  public getPartNumber(): string {
    return (this.part_number || '').toString();
  }

  public getSerialNumber(): string {
    return (this.serial_number || '').toString();
  }

  public getWebService(): string {
    return (this.web_service || '').toString();
  }
}
