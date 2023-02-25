import Homey from 'homey';
import PairSession from 'homey/lib/PairSession';
import { isIPV4Address } from 'ip-address-validator';
import { TWC } from '../../lib/twc';

export class TWCDriver extends Homey.Driver {

  async onInit() {
    this.log('Tesla Wall Connector driver has been initialized');
  }
  
  async onPair(session: PairSession) {

    let address = '';

    session.setHandler('charger_ip_confirmed', async (ipView) => {
      this.log('pair: charger_ip_confirmed');
      address = ipView;
      this.log(address);
      if (isIPV4Address(address)) {
        this.log(address);
        return true;
      } else {
        this.log('invalid ip provided');
        return false;
      }
    });

    session.setHandler('list_devices', async () => {
      this.log('pair: list_devices');
      let api = new TWC(address);
      const result = (await api.getVersion());
      const devices = [
        {
          name: "TWC Gen3",
          data: {
            id: result == null ? "" : result.getSerialNumber(),
            ip: address,
          },
          icon: 'icon.svg'
        }
      ];
      this.log(devices);
      return devices;
    });
  }
}
module.exports = TWCDriver;
