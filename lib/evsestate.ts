import { stat } from "fs";

/*
* Added thanks to Wallmonitor https://wallmonitor.app/ and https://www.msxfaq.de/sonst/stromer/tesla_wallbox_gen_3.htm
*/
export enum EVSEState {
    Starting = 0,                       // Wallbox starts
    NoVehicleConnected = 1,             // No vehicle connected
    ConnectedNotReady = 2,              // Connected and not ready
    Unknown3 = 3,                       // Still missing information here
    ConnectedReady = 4,                 // Connected and ready
    Unknown5 = 5,                       // Still missing information here
    ConnectedNegotiating = 6,           // Vehicle connected, negotiation
    ConnectedFinishedCharging = 7,                       // Still missing information here
    ConnectedFullyCharged = 8,          // Vehicle connected and fully charged (locking does not matter)
    ReadyToChargeWaitingOnVehicle = 9,  // Ready to load, waiting for vehicle
    ChargePowerReduced = 10,            // Charging at reduced power (car not drawing full power, may be normal for some PHEVs)
    Charging = 11,                      // Charging with 3 phases at 16A (e.g., 11kW)
    Unknown12 = 12,                      // Sometimes seen between 2 and 8
    Unknown13 = 13
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

export function getEVSEStateString(value: number): string | undefined {
    if (Object.values(EVSEState).includes(value)) {
        const state = getEVSEStateFromNumber(value)
        if(state !== undefined)
            return EVSEStateMap[state];
    }
    return undefined; // Return undefined if the number does not map to a valid enum
}

const EVSEStateMap: { [key in EVSEState]: string } = {
  [EVSEState.Starting]: "starting",
  [EVSEState.NoVehicleConnected]: "no_vehicle",
  [EVSEState.ConnectedNotReady]: "connected_not_ready",
  [EVSEState.Unknown3]: "unknown3",
  [EVSEState.ConnectedReady]: "connected_ready",
  [EVSEState.Unknown5]: "unknown5",
  [EVSEState.ConnectedNegotiating]: "negotiating",
  [EVSEState.ConnectedFinishedCharging]: "finished_charging",
  [EVSEState.ConnectedFullyCharged]: "fully_charged",
  [EVSEState.ReadyToChargeWaitingOnVehicle]: "waiting_vehicle",
  [EVSEState.ChargePowerReduced]: "reduced_power",
  [EVSEState.Charging]: "charging",
  [EVSEState.Unknown12]: "unknown12",
  [EVSEState.Unknown13]: "unknown13"
};