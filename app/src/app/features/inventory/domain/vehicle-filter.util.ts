import { Vehicle } from '../models/vehicle.model';
import { VehicleFilter } from '../models/vehicle-filter.model';
import { AgingSeverity } from './inventory-age.util';
import { VehicleAction } from '../models/vehicle-action.model';

export interface VehicleWithAge extends Vehicle {
  ageDays: number;
  severity: AgingSeverity;
  isAging: boolean;
  latestAction?: VehicleAction;
}

export function matchesFilter(vehicle: VehicleWithAge, filter: VehicleFilter): boolean {
  if (filter.make && vehicle.make.toLowerCase() !== filter.make.toLowerCase()) return false;
  if (filter.model && vehicle.model.toLowerCase() !== filter.model.toLowerCase()) return false;
  if (filter.status && vehicle.status !== filter.status) return false;
  if (filter.agingOnly && !vehicle.isAging) return false;

  if (filter.search.trim()) {
    const needle = filter.search.trim().toLowerCase();
    const haystack = `${vehicle.make} ${vehicle.model} ${vehicle.vin}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }

  return true;
}

export function filterVehicles(
  vehicles: VehicleWithAge[],
  filter: VehicleFilter,
): VehicleWithAge[] {
  return vehicles.filter((v) => matchesFilter(v, filter));
}
