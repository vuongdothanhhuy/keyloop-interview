// app/src/app/features/inventory/domain/vehicle-enrichment.util.ts
import { Vehicle } from '../models/vehicle.model';
import { VehicleAction } from '../models/vehicle-action.model';
import { getAgingSeverity, getInventoryAgeDays, isAgingStock } from './inventory-age.util';
import { VehicleWithAge } from './vehicle-filter.util';

function latestActionFor(vehicleId: string, actions: VehicleAction[]): VehicleAction | undefined {
  return actions
    .filter((a) => a.vehicleId === vehicleId)
    .sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (diff !== 0) return diff;
      // Tie-break deterministically: json-server assigns monotonically increasing string ids,
      // so a numeric-aware id comparison surfaces the actually-latest action instead of relying
      // on input-order stability when two actions share a createdAt.
      return b.id.localeCompare(a.id, undefined, { numeric: true });
    })[0];
}

export function enrichVehicles(
  vehicles: Vehicle[],
  actions: VehicleAction[],
  asOf: Date,
): VehicleWithAge[] {
  return vehicles.map((vehicle) => {
    const ageDays = getInventoryAgeDays(vehicle.intakeDate, asOf);
    return {
      ...vehicle,
      ageDays,
      isAging: isAgingStock(ageDays),
      severity: getAgingSeverity(ageDays),
      latestAction: latestActionFor(vehicle.id, actions),
    };
  });
}
