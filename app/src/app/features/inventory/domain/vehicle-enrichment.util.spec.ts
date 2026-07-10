import { Vehicle } from '../models/vehicle.model';
import { VehicleAction } from '../models/vehicle-action.model';
import { enrichVehicles } from './vehicle-enrichment.util';

function makeVehicle(overrides: Partial<Vehicle>): Vehicle {
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
    ...overrides,
  };
}

describe('enrichVehicles', () => {
  const asOf = new Date('2026-07-09T00:00:00.000Z');

  it('attaches ageDays, severity, and isAging to each vehicle', () => {
    const vehicles = [makeVehicle({ id: 'V1', intakeDate: '2026-04-01' })]; // 99 days -> aging
    const [enriched] = enrichVehicles(vehicles, [], asOf);
    expect(enriched.ageDays).toBe(99);
    expect(enriched.isAging).toBe(true);
    expect(enriched.severity).toBe('aging');
  });

  it('attaches the most recent action as latestAction, ordered by createdAt', () => {
    const vehicles = [makeVehicle({ id: 'V1' })];
    const actions: VehicleAction[] = [
      {
        id: 'a1',
        vehicleId: 'V1',
        actionType: 'manager_review',
        note: 'older',
        loggedBy: 'Alex',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
      {
        id: 'a2',
        vehicleId: 'V1',
        actionType: 'price_reduction_planned',
        note: 'newer',
        loggedBy: 'Alex',
        createdAt: '2026-06-15T00:00:00.000Z',
      },
    ];
    const [enriched] = enrichVehicles(vehicles, actions, asOf);
    expect(enriched.latestAction?.id).toBe('a2');
  });

  it('leaves latestAction undefined when there are no actions for that vehicle', () => {
    const vehicles = [makeVehicle({ id: 'V1' })];
    const actions: VehicleAction[] = [
      {
        id: 'a1',
        vehicleId: 'OTHER-VIN',
        actionType: 'manager_review',
        note: 'not this vehicle',
        loggedBy: 'Alex',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
    ];
    const [enriched] = enrichVehicles(vehicles, actions, asOf);
    expect(enriched.latestAction).toBeUndefined();
  });

  it('breaks createdAt ties deterministically by id (higher id wins)', () => {
    // Same createdAt is possible when ClockService is mocked to a fixed value, as in tests
    // and in rapid-fire logging within the same millisecond.
    const vehicles = [makeVehicle({ id: 'V1' })];
    const tiedCreatedAt = '2026-06-01T00:00:00.000Z';
    const actions: VehicleAction[] = [
      { id: '5', vehicleId: 'V1', actionType: 'manager_review', note: 'first', loggedBy: 'Alex', createdAt: tiedCreatedAt },
      { id: '12', vehicleId: 'V1', actionType: 'price_reduction_planned', note: 'second', loggedBy: 'Alex', createdAt: tiedCreatedAt },
    ];
    const [enriched] = enrichVehicles(vehicles, actions, asOf);
    expect(enriched.latestAction?.id).toBe('12');
  });
});
