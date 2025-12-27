# Tesla Power Connect for Homey

Connect directly to your **Tesla Wall Connector (Gen 3 and Universal)** to monitor energy usage, check charger state, and automate your charging based on real-time data.

Stay charged, always connected. ⚡

## Features
- **Real-time Monitoring**: Track voltage, current, power, and temperatures across all phases.
- **Smart Automation**: Trigger flows when charging starts, stops, or when the connection state changes.
- **Detailed Statistics**: View total energy usage (with Wh/kWh/MWh scaling) and detailed uptime/session durations.
- **Diagnostic Data**: Access technical details like `Git Branch`, `Web Service` version, and `EVSE Not Ready Reasons`.
- **Local Control**: Communicates directly with your Wall Connector over your local network—no cloud required.
- **Easy Pairing**: Fully automated discovery using mDNS.

## Supported Devices
- Tesla Wall Connector Generation 3
- Tesla Universal Wall Connector

## Setup & Pairing
The app uses **Automatic mDNS Discovery**. When adding a new device, Homey will automatically scan your network for compatible Wall Connectors. 

> [!TIP]
> While discovery is automatic, it is highly recommended to set a **Static IP** or **DHCP Reservation** for your Wall Connector in your router settings to ensure instant and permanent connectivity.

## Capabilities
- **Power & Energy**: Current Power (W), Session Energy (kWh), Total Energy (MWh).
- **Electrical States**: Voltage (V) and Current (A) for individual phases (L1/L2/L3) and Grid frequency.
- **Health & Safety**: PCBA, MCU, Handle, and Charger temperatures.
- **Charger Status**: Connection state, EVSE state, and active technical alerts.

## Disclaimer
Tesla and Tesla Wall Connector are trademarks of Tesla Inc. This application is an independent project and does not indicate endorsement of or affiliation with Tesla Inc.
