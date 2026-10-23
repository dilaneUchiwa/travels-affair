import type { ServiceType } from "../service-types";
import type { ServiceAdapter } from "../types";
import { activityAdapter } from "./activity";
import { carAdapter } from "./car";
import { flightAdapter } from "./flight";
import { hotelAdapter } from "./hotel";
import { transportAdapter } from "./transport";

/** Point unique de câblage des services réservables. */
const adapters: Record<ServiceType, ServiceAdapter> = {
  FLIGHT: flightAdapter,
  HOTEL: hotelAdapter,
  TRANSPORT: transportAdapter,
  CAR: carAdapter,
  ACTIVITY: activityAdapter,
};

export const getAdapter = (type: string): ServiceAdapter => {
  const a = adapters[type as ServiceType];
  if (!a) throw new Error(`Service inconnu : ${type}`);
  return a;
};
