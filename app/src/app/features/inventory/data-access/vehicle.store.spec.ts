// app/src/app/features/inventory/data-access/vehicle.store.spec.ts
import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { VehicleStore } from './vehicle.store';
import { VehicleService } from './vehicle.service';
import { VehicleActionService } from './vehicle-action.service';
import { ClockService } from '../../../core/clock.service';
import { Vehicle } from '../models/vehicle.model';
import { NewVehicleAction, VehicleAction } from '../models/vehicle-action.model';

const FIXED_NOW = new Date('2026-07-09T00:00:00.000Z');

function vehicle(overrides: Partial<Vehicle>): Vehicle {
  return {
    id: 'V1',
    vin: 'V1',
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
    intakeDate: '2026-01-01', // ~190 days -> aging
    status: 'in_stock',
    imageUrl: '',
    imageWidth: 400,
    imageHeight: 300,
    ...overrides,
  };
}

describe('VehicleStore', () => {
  function setup(overrides?: {
    getVehicles?: () => ReturnType<VehicleService['getVehicles']>;
    getAllActions?: () => ReturnType<VehicleActionService['getAllActions']>;
    logAction?: () => ReturnType<VehicleActionService['logAction']>;
    now?: () => Date;
  }) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: VehicleService,
          useValue: { getVehicles: overrides?.getVehicles ?? (() => of([vehicle({})])) },
        },
        {
          provide: VehicleActionService,
          useValue: {
            getAllActions: overrides?.getAllActions ?? (() => of([])),
            logAction:
              overrides?.logAction ??
              (() =>
                of({
                  id: 'a1',
                  vehicleId: 'V1',
                  actionType: 'price_reduction_planned',
                  note: 'note',
                  loggedBy: 'Alex',
                  createdAt: FIXED_NOW.toISOString(),
                } satisfies VehicleAction)),
          },
        },
        { provide: ClockService, useValue: { now: overrides?.now ?? (() => FIXED_NOW) } },
      ],
    });
    return TestBed.inject(VehicleStore);
  }

  it('starts with an empty, non-loading state', () => {
    const store = setup();
    expect(store.vehicles()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('load() populates vehicles/actions and enriches them using the injected clock', () => {
    const store = setup();
    store.load();
    expect(store.loading()).toBe(false);
    expect(store.enrichedVehicles().length).toBe(1);
    expect(store.enrichedVehicles()[0].isAging).toBe(true); // Jan 1 -> Jul 9 is >90 days
  });

  it('load() surfaces an error and stops loading on HTTP failure', () => {
    const store = setup({ getVehicles: () => throwError(() => new Error('network down')) });
    store.load();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('network down');
    expect(store.vehicles()).toEqual([]);
  });

  it('updateFilter() narrows filteredVehicles via the pure filter function', () => {
    const store = setup({
      getVehicles: () => of([vehicle({ id: 'V1', make: 'Toyota' }), vehicle({ id: 'V2', make: 'Ford' })]),
    });
    store.load();
    store.updateFilter({ make: 'Ford' });
    expect(store.filteredVehicles().map((v) => v.id)).toEqual(['V2']);
  });

  it('agingVehicles() only contains vehicles past the 90-day threshold', () => {
    const store = setup({
      getVehicles: () =>
        of([
          vehicle({ id: 'FRESH', intakeDate: '2026-07-01' }), // 8 days
          vehicle({ id: 'OLD', intakeDate: '2026-01-01' }), // ~190 days
        ]),
    });
    store.load();
    expect(store.agingVehicles().map((v) => v.id)).toEqual(['OLD']);
  });

  it('kpis() reflects computeInventoryKpis over the enriched vehicles', () => {
    const store = setup();
    store.load();
    expect(store.kpis().totalVehicles).toBe(1);
  });

  it('availableMakes() returns distinct, sorted makes across all vehicles', () => {
    const store = setup({
      getVehicles: () =>
        of([vehicle({ id: 'V1', make: 'Toyota' }), vehicle({ id: 'V2', make: 'Ford' }), vehicle({ id: 'V3', make: 'Ford' })]),
    });
    store.load();
    expect(store.availableMakes()).toEqual(['Ford', 'Toyota']);
  });

  it('availableModels() narrows to the selected make once one is chosen', () => {
    const store = setup({
      getVehicles: () =>
        of([
          vehicle({ id: 'V1', make: 'Toyota', model: 'Corolla' }),
          vehicle({ id: 'V2', make: 'Toyota', model: 'RAV4' }),
          vehicle({ id: 'V3', make: 'Ford', model: 'Focus' }),
        ]),
    });
    store.load();
    expect(store.availableModels()).toEqual(['Corolla', 'Focus', 'RAV4']);
    store.updateFilter({ make: 'Toyota' });
    expect(store.availableModels()).toEqual(['Corolla', 'RAV4']);
  });

  it('logAction() optimistically appends the new action so latestAction updates immediately', () => {
    const store = setup();
    store.load();
    const input: NewVehicleAction = {
      vehicleId: 'V1',
      actionType: 'price_reduction_planned',
      note: 'note',
      loggedBy: 'Alex',
    };
    store.logAction(input);
    expect(store.enrichedVehicles()[0].latestAction?.actionType).toBe('price_reduction_planned');
  });

  it('logAction() rolls back and surfaces an error if the HTTP call fails', () => {
    const store = setup({ logAction: () => throwError(() => new Error('save failed')) });
    store.load();
    const before = store.actions();
    store.logAction({
      vehicleId: 'V1',
      actionType: 'price_reduction_planned',
      note: 'note',
      loggedBy: 'Alex',
    });
    expect(store.error()).toBe('save failed');
    expect(store.actions()).toEqual(before); // rolled back, no phantom action left behind
  });

  it('logAction() rollback only removes its own optimistic entry, not a different concurrent action that already succeeded', () => {
    const subjects: Subject<VehicleAction>[] = [];
    let tick = 0;
    const store = setup({
      logAction: (): Observable<VehicleAction> => {
        const subject = new Subject<VehicleAction>();
        subjects.push(subject);
        return subject.asObservable();
      },
      // Each logAction() call reads clock.now() twice (optimisticId, then createdAt).
      // Advancing on every read gives the two concurrent calls distinct optimisticIds,
      // matching real-world behavior where clock.now() moves forward between calls.
      now: () => new Date(FIXED_NOW.getTime() + tick++),
    });
    store.load();

    store.logAction({ vehicleId: 'V1', actionType: 'manager_review', note: 'will fail', loggedBy: 'Alex' });
    store.logAction({ vehicleId: 'V1', actionType: 'price_reduction_planned', note: 'will succeed', loggedBy: 'Alex' });
    expect(store.actions().length).toBe(2);

    // The second call resolves successfully first.
    subjects[1].next({
      id: 'real-b',
      vehicleId: 'V1',
      actionType: 'price_reduction_planned',
      note: 'will succeed',
      loggedBy: 'Alex',
      createdAt: FIXED_NOW.toISOString(),
    });
    subjects[1].complete();

    // The first call then fails.
    subjects[0].error(new Error('save failed'));

    expect(store.error()).toBe('save failed');
    expect(store.actions().some((a) => a.id === 'real-b')).toBe(true); // survives the other call's rollback
    expect(store.actions().length).toBe(1); // only the failed call's own optimistic entry was removed
  });
});
