import fetch from 'node-fetch';
import {version} from './version';
import {lifetime} from './lifetime';
import {vitals} from './vitals';
import {wifi_status} from './wifi_status';

export class TWC {

    address : string;
    constructor (address:string){
        this.address = address;
    }

    async getVitals(): Promise<vitals|null> {
        return fetch(`http://${this.address}/api/1/vitals`)
            .then(res => res.json())
            .then(res => { return res as vitals })
            .catch( e => {console.log(e) ; return null;})
    }
    
    async getWifiStatus(): Promise<wifi_status|null> {
        return fetch(`http://${this.address}/api/1/wifi_status`)
            .then(res => res.json())
            .then(res => { return res as wifi_status })
            .catch( e => {console.log(e); return null; })
    }

    async getLifetime(): Promise<lifetime|null> {
        return fetch(`http://${this.address}/api/1/lifetime`)
            .then(res => res.text())
            .then(res => { 
                res = res.replace(":nan",":0");
                return JSON.parse(res) as lifetime;
            })
            .catch( e => {console.log(e); return null; })
    }

    async getVersion(): Promise<version|null> {
        return fetch(`http://${this.address}/api/1/version`)
            .then(res => res.json())
            .then(res => { return res as version })
            .catch( e => {console.log(e); return null; })
    }
}