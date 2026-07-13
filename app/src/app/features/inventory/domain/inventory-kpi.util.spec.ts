import { VehicleWithAge } from './vehicle-filter.util';
import { computeInventoryKpis } from './inventory-kpi.util';

function makeVehicle(ageDays: number, isAging: boolean): VehicleWithAge {
  return {
    id: `v-${ageDays}-${Math.random()}`,
    vin: 'VIN',
    make: 'Toyota',
    model: 'Corolla',
    trim: 'Base',
    year: 2024,
    color: 'Blue',
    bodyType: 'Sedan',
    fuelType: 'Petrol',
    mileage: 1000,
    price: 20000,
    dealershipId: 'DEALER-001',
    intakeDate: '2026-01-01',
    status: 'in_stock',
    imageUrl: '',
    imageWidth: 400,
    imageHeight: 300,
    ageDays,
    severity: 'fresh',
    isAging,
  };
}

describe('computeInventoryKpis', () => {
  it('returns all-zero KPIs for an empty inventory', () => {
    expect(computeInventoryKpis([])).toEqual({
      totalVehicles: 0,
      agingCount: 0,
      agingPercentage: 0,
      averageAgeDays: 0,
    });
  });

  it('computes totals, aging count/percentage, and average age', () => {
    const vehicles = [
      makeVehicle(10, false),
      makeVehicle(50, false),
      makeVehicle(100, true),
      makeVehicle(200, true),
    ];
    const kpis = computeInventoryKpis(vehicles);
    expect(kpis.totalVehicles).toBe(4);
    expect(kpis.agingCount).toBe(2);
    expect(kpis.agingPercentage).toBe(50);
    expect(kpis.averageAgeDays).toBe(90); // (10+50+100+200)/4
  });

  it('rounds agingPercentage to one decimal place', () => {
    const vehicles = [makeVehicle(10, false), makeVehicle(100, true), makeVehicle(10, false)];
    expect(computeInventoryKpis(vehicles).agingPercentage).toBeCloseTo(33.3, 1);
  });
});
