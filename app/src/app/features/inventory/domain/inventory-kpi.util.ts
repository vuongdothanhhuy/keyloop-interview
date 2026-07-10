import { VehicleWithAge } from './vehicle-filter.util';

export interface InventoryKpis {
  totalVehicles: number;
  agingCount: number;
  agingPercentage: number; // 0-100, rounded to 1 decimal
  averageAgeDays: number;
}

export function computeInventoryKpis(vehicles: VehicleWithAge[]): InventoryKpis {
  const totalVehicles = vehicles.length;
  if (totalVehicles === 0) {
    return { totalVehicles: 0, agingCount: 0, agingPercentage: 0, averageAgeDays: 0 };
  }

  const agingCount = vehicles.filter((v) => v.isAging).length;
  const totalAge = vehicles.reduce((sum, v) => sum + v.ageDays, 0);

  return {
    totalVehicles,
    agingCount,
    agingPercentage: Math.round((agingCount / totalVehicles) * 1000) / 10,
    averageAgeDays: Math.round(totalAge / totalVehicles),
  };
}
