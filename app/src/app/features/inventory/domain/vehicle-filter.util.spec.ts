import { EMPTY_VEHICLE_FILTER } from '../models/vehicle-filter.model';
import { filterVehicles, matchesFilter, VehicleWithAge } from './vehicle-filter.util';

function makeVehicle(overrides: Partial<VehicleWithAge>): VehicleWithAge {
  return {
    id: 'VIN1',
    vin: 'VIN1',
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
    ageDays: 45,
    severity: 'fresh',
    isAging: false,
    ...overrides,
  };
}

describe('matchesFilter', () => {
  it('matches everything against the empty filter', () => {
    expect(matchesFilter(makeVehicle({}), EMPTY_VEHICLE_FILTER)).toBe(true);
  });

  it('filters by make (case-insensitive)', () => {
    const v = makeVehicle({ make: 'Toyota' });
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, make: 'toyota' })).toBe(true);
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, make: 'Ford' })).toBe(false);
  });

  it('filters by model', () => {
    const v = makeVehicle({ model: 'Corolla' });
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, model: 'Corolla' })).toBe(true);
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, model: 'RAV4' })).toBe(false);
  });

  it('filters by status', () => {
    const v = makeVehicle({ status: 'reserved' });
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, status: 'reserved' })).toBe(true);
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, status: 'in_stock' })).toBe(false);
  });

  it('filters to aging-only when agingOnly is set', () => {
    const fresh = makeVehicle({ isAging: false });
    const aging = makeVehicle({ isAging: true });
    const filter = { ...EMPTY_VEHICLE_FILTER, agingOnly: true };
    expect(matchesFilter(fresh, filter)).toBe(false);
    expect(matchesFilter(aging, filter)).toBe(true);
  });

  it('free-text search matches make, model, or VIN, case-insensitively', () => {
    const v = makeVehicle({ make: 'Toyota', model: 'Corolla', vin: 'ABC123' });
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, search: 'corolla' })).toBe(true);
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, search: 'abc123' })).toBe(true);
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, search: 'nissan' })).toBe(false);
  });

  it('combines multiple active filter fields with AND semantics', () => {
    const v = makeVehicle({ make: 'Toyota', model: 'Corolla', isAging: true });
    const passingFilter = { ...EMPTY_VEHICLE_FILTER, make: 'Toyota', agingOnly: true };
    const failingFilter = { ...EMPTY_VEHICLE_FILTER, make: 'Toyota', model: 'RAV4' };
    expect(matchesFilter(v, passingFilter)).toBe(true);
    expect(matchesFilter(v, failingFilter)).toBe(false);
  });
});

describe('filterVehicles', () => {
  it('returns an empty array when nothing matches', () => {
    const vehicles = [makeVehicle({ make: 'Toyota' }), makeVehicle({ make: 'Ford' })];
    expect(filterVehicles(vehicles, { ...EMPTY_VEHICLE_FILTER, make: 'BMW' })).toEqual([]);
  });

  it('preserves input order for matching vehicles', () => {
    const vehicles = [
      makeVehicle({ id: 'A', make: 'Toyota' }),
      makeVehicle({ id: 'B', make: 'Toyota' }),
    ];
    const result = filterVehicles(vehicles, { ...EMPTY_VEHICLE_FILTER, make: 'Toyota' });
    expect(result.map((v) => v.id)).toEqual(['A', 'B']);
  });
});
