export enum Capability {
    METER_POWER_TOTAL = 'meter_power.total',
    METER_POWER = 'meter_power',
    MEASURE_POWER = 'measure_power',
    EVCHARGER_CHARGING_STATE = 'evcharger_charging_state',
    EVSE_STATE = 'evse_state',
    MEASURE_EVSE_STATE = 'measure_evse_state',
    MEASURE_TWC_POWER_VEHICLE = 'measure_twc_power.vehicle',
    METER_POWER_VEHICLE = 'meter_power.vehicle',
    ALARM_TWC_STATE_EVSE = 'alarm_twc_state.evse',
    MEASURE_CURRENT_VEHICLE = 'measure_current.vehicle',
    MEASURE_CURRENT_A = 'measure_current.a',
    MEASURE_CURRENT_B = 'measure_current.b',
    MEASURE_CURRENT_C = 'measure_current.c',
    MEASURE_CURRENT_N = 'measure_current.n',
    MEASURE_TWC_VOLTAGE_A = 'measure_twc_voltage.a',
    MEASURE_TWC_VOLTAGE_B = 'measure_twc_voltage.b',
    MEASURE_TWC_VOLTAGE_C = 'measure_twc_voltage.c',
    MEASURE_TEMPERATURE_HANDLE = 'measure_temperature.handle',
    MEASURE_TEMPERATURE_MCU = 'measure_temperature.mcu',
    MEASURE_TEMPERATURE_PCBA = 'measure_temperature.pcba',
    MEASURE_TEMPERATURE_CHARGER = 'measure_temperature.charger',
    MEASURE_TWC_VOLTAGE_GRID = 'measure_twc_voltage.grid',
    MEASURE_FREQUENCY_GRID = 'measure_frequency.grid',
    MEASURE_TWC_VOLTAGE_RELAY_COIL_V = 'measure_twc_voltage.relay_coil_v',
    MEASURE_TWC_VOLTAGE_PROX_V = 'measure_twc_voltage.prox_v',
    MEASURE_TWC_VOLTAGE_PILOT_HIGH_V = 'measure_twc_voltage.pilot_high_v',
    MEASURE_TWC_VOLTAGE_PILOT_LOW_V = 'measure_twc_voltage.pilot_low_v',
    ALARM_TWC_STATE_CONTACTOR = 'alarm_twc_state.contactor',
    MEASURE_SIGNAL_STRENGTH = 'measure_signal_strength',
    MEASURE_VOLTAGE_THERMOPILE = 'measure_voltage.thermopile',
    MEASURE_SNR = 'measure_snr',
}

export enum Settings {
    POLLING_INTERVAL = 'polling_interval',
    VOLTAGE_ADJUSTMENT = 'voltage_adjustment',
    IP = 'ip',
    SERIAL_NUMBER = 'serial_number',
}

export enum Debug {
    POLL_STATUS = 'debug_poll_status',
    LAST_SUCCESS = 'debug_last_success',
    LAST_FAILURE = 'debug_last_failure',
    LAST_ERROR = 'debug_last_error',
    POLL_COUNT = 'debug_poll_count',
    FAILURE_COUNT = 'debug_failure_count',
    IP_ADDRESS = 'debug_ip_address',
}

export enum BooleanState {
    YES = 'Yes',
    NO = 'No',
}

export enum Flow {
    IS_CHARGING = 'is_charging',
    IS_CONNECTED = 'is_connected',
    CHARGER_STATUS_CHANGED = 'charger_status_changed',
}

export enum Pairing {
    LIST_DEVICES = 'list_devices',
    MANUAL_ADD = 'manual_add',
}

export enum Translation {
    ERROR_DEVICE_NOT_FOUND = 'pair.twc.error_device_not_found',
}

export enum Discovery {
    WC_MODEL_KEY = 'wc',
}

export enum Unit {
    MONTH = 'mo',
    WEEK = 'w',
    DAY = 'd',
    HOUR = 'h',
    MINUTE = 'm',
    SECOND = 's',
    WATT_HOUR = 'Wh',
    KILO_WATT_HOUR = 'kWh',
    MEGA_WATT_HOUR = 'MWh',
    PERCENT = '%',
    DECIBEL = 'dB',
}

export enum ChargeStatus {
    CHARGING = 'Charging',
    CONNECTED = 'Connected',
    FINISHED = 'Finished',
    DISCONNECTED = 'Disconnected',
    ERROR = 'Error',
    UNKNOWN = 'Unknown',
}

export enum PollStatus {
    OK = 'OK',
    FAILING = 'FAILING',
}

export enum Log {
    INIT_TWC = 'Initializing TWC device: ',
    INIT_SUCCESS = 'TWC device initialized successfully. Firmware: ',
    INIT_FAIL_SERIAL = 'TWC device initialization failed: Serial Number Mismatch or device unreachable.',
    SETTINGS_CHANGED = 'Settings changed',
    POLL_INTERVAL_CHANGED = 'Change poll interval ',
    STATUS_CHANGED = 'Status changed: ',
    CHARGING_STATE_CHANGED = 'Charging state changed: ',
    ERR_VERSION = 'Error fetching Version info',
    ERR_SET_VERSION = 'Error fetching/setting Version',
    ERR_WIFI = 'Error fetching Wifi status',
    ERR_SET_WIFI = 'Error fetching/setting Wifi status',
    ERR_LIFETIME = 'Error fetching Lifetime stats',
    ERR_SET_LIFETIME = 'Error fetching/setting Lifetime',
    ERR_VITALS = 'Error fetching Vitals',
    ERR_SET_CAPABILITY = 'Failed to set ',
    ERR_APPLY_SETTINGS = 'Error applying batched settings',
    POLL_FAILED = 'Poll cycle failed: ',
    UNEXPECTED_ERROR = 'Unexpected error in poll cycle:',
    IDENTITY_VERIFIED = 'Device identity verified (Serial: ',
    IDENTITY_FAILED = 'Identity verification failed (will retry next cycle)',
    SERIAL_MISMATCH = 'Serial Mismatch! Expected: ',
}

export enum ApiEndpoint {
    VITALS = 'vitals',
    WIFI_STATUS = 'wifi_status',
    LIFETIME = 'lifetime',
    VERSION = 'version',
}

export enum DriverLog {
    INIT = 'Tesla Wall Connector driver has been initialized',
    INIT_DISCOVERY = 'onInit: Current Discovery Results:',
    REGISTER_FLOWS = 'Registering flow card listeners...',
    ON_PAIR = 'onPair called',
    REGISTER_LIST = 'Registering list_devices handler...',
    LIST_TRIGGERED = 'pair: list_devices handler triggered',
    DISCOVERY_INIT_COUNT = 'Initial discovery results count: ',
    DISCOVERY_RETRY = 'No discovery results yet, attempt ',
    DISCOVERY_FOUND_COUNT = 'Found ',
    SKIP_NO_ADDR = 'Skipping discovery result without address',
    SKIP_NON_WC = 'Skipping non-Wall Connector device (model: ',
    PROBING = 'Probing discovered device at ',
    DEVICE_FOUND = 'Device found: ',
    DEVICE_NO_SERIAL = 'Device at ',
    RETURNING_DEVICES = 'Returning devices:',
    MANUAL_TRIGGERED = 'pair: manual_add triggered for address: ',
    PROBING_MANUAL = 'Probing manual address ',
    MANUAL_SUCCESS = 'Success: Found TWC ',
}

export enum ErrorMsg {
    PROBE_FAILED = 'Failed to probe discovered device at ',
    MANUAL_NO_SERIAL = 'Manual probe failed: Device at ',
    MANUAL_GENERIC = 'Device found but did not return a valid serial number.',
    MANUAL_ADD_FAILED = 'Failed to manually add device at ',
    CONNECT_FAILED = 'Could not connect to device at ',
    TWC_ERROR = 'TWC Error ',
}
