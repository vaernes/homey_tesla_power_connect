export class version {
  firmware_version!: string;
  part_number!: string;
  serial_number!: string;
  ss!: string;

  public constructor(json: any) {
    this.firmware_version = json.firmware_version;
    this.part_number = json.part_number;
    this.serial_number = json.serial_number;
  }

  public getFirmwareVersion(): string {
    if (this.firmware_version === undefined) {
      return '';
    }
    return this.firmware_version.toString();
  }

  public getPartNumber(): string {
    if (this.part_number === undefined) {
      return '';
    }
    return this.part_number.toString();
  }

  public getSerialNumber(): string {
    if (this.serial_number === undefined) {
      return '';
    }
    return this.serial_number.toString();
  }
}
