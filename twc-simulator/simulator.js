const http = require('http');
const os = require('os');
const { Bonjour } = require('bonjour-service');

const PORT = 80;
const SERIAL = 'PGT11111111111';
const MODEL = 'wc3';
const FIRMWARE = '25.10.0';
const PART_NUMBER = '1111111-01-A';
const NAME = `${PART_NUMBER}--${SERIAL}`;

// IP detection helper
const getLocalIp = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
};

const bonjour = new Bonjour();
let currentAd = null;
let lastKnownIp = null;

const publishMdns = (ip) => {
    if (currentAd) {
        console.log(`Unpublishing old mDNS advertisement for ${lastKnownIp}`);
        currentAd.stop();
    }

    currentAd = bonjour.publish({
        name: NAME,
        type: 'tedapi',
        protocol: 'tcp',
        port: 4743,
        host: `${NAME}.local`,
        id: NAME,
        address: ip,
        txt: {
            model: MODEL,
            fwver: FIRMWARE,
            transport: 'tls_socket'
        }
    });

    lastKnownIp = ip;
    console.log(`mDNS advertising as "${NAME}._tedapi._tcp.local" at ${ip}`);
};

const checkIpChange = () => {
    const currentIp = getLocalIp();
    if (currentIp !== lastKnownIp) {
        console.log(`[${new Date().toISOString()}] IP change detected: ${lastKnownIp} -> ${currentIp}`);
        publishMdns(currentIp);
    }
};

// API Handlers
const handlers = {
    '/api/1/version': (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            firmware_version: FIRMWARE,
            git_branch: 'master',
            part_number: PART_NUMBER,
            serial_number: SERIAL,
            web_service: 'enabled'
        }));
    },
    '/api/1/vitals': (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            evse_state: 1, // Ready
            vehicle_connected: false,
            vehicle_current_a: 0,
            grid_v: 231.5,
            grid_hz: 50.0,
            mcu_temp_c: 25.4,
            pcba_temp_c: 26.1,
            handle_temp_c: 22.3,
            current_alerts: []
        }));
    },
    '/api/1/wifi_status': (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            wifi_ssid: Buffer.from('Tesla_Guest').toString('base64'),
            wifi_signal_strength: 85,
            wifi_rssi: -55,
            wifi_snr: 40,
            wifi_connected: true,
            internet: true,
            wifi_infra_ip: getLocalIp(),
            wifi_mac: 'AA:BB:CC:DD:EE:FF'
        }));
    },
    '/api/1/lifetime': (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            contactor_cycles: 150,
            energy_wh: 1234567,
            uptime_s: 3600,
            charge_starts: 42
        }));
    }
};

const server = http.createServer((req, res) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    const handler = handlers[req.url];
    if (handler) {
        handler(req, res);
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`--- TWC Simulator ---`);
    console.log(`HTTP API listening on port ${PORT}`);
    console.log(`Serial: ${SERIAL}`);
    console.log(`Model: ${MODEL}`);
    console.log(`Firmware: ${FIRMWARE}`);

    // Initial advertisement
    const initialIp = getLocalIp();
    publishMdns(initialIp);

    // Start IP monitoring
    setInterval(checkIpChange, 5000);

    console.log(`Press Ctrl+C to stop`);
});

process.on('SIGINT', () => {
    console.log('\nStopping simulator...');
    bonjour.destroy();
    server.close(() => {
        process.exit();
    });
});
