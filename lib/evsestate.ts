export enum EVSEState {
    Starting = 0, // EVSE is initializing
    NoVehicleConnected = 1, // No vehicle is connected to the EVSE
    ConnectedNotReady = 2, // Vehicle connected but not ready to charge
    Unknown3 = 3, // Unknown state, further investigation needed
    ConnectedReady = 4, // Vehicle connected and ready to charge
    Unknown5 = 5, // Unknown state, further investigation needed
    ConnectedNegotiating = 6, // Vehicle and EVSE are negotiating charging parameters
    Unknown7 = 7, // Unknown state, further investigation needed
    ConnectedFullyCharged = 8, // Vehicle connected and fully charged
    ReadyToChargeWaitingOnVehicle = 9, // EVSE ready but waiting on vehicle to initiate
    ChargePowerReduced = 10, // Charging with reduced power (potentially non-Tesla vehicle)
    Charging = 11, // Vehicle is actively charging
    Unknown12 = 12, // Unknown state, further investigation needed
    Unknown13 = 13 // Unknown state, further investigation needed
}

/**
 * Returns the corresponding EVSEState enum value for a given number.
 * @param value The numeric value representing an EVSE state.
 * @returns The corresponding EVSEState enum value, or undefined if the number is invalid.
 */
export function getEVSEStateFromNumber(value: number): EVSEState | undefined {
    if (Object.values(EVSEState).includes(value)) {
        return value as EVSEState;
    }
    return undefined; // Return undefined if the number does not map to a valid enum
}
