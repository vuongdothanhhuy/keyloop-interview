// app/src/app/features/inventory/data-access/vehicle.store.ts
import { Service, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ClockService } from '../../../core/clock.service';
import { NewVehicleAction, VehicleAction, VehicleActionDraft } from '../models/vehicle-action.model';
import { EMPTY_VEHICLE_FILTER, VehicleFilter } from '../models/vehicle-filter.model';
import { Vehicle } from '../models/vehicle.model';
import { enrichVehicles } from '../domain/vehicle-enrichment.util';
import { filterVehicles } from '../domain/vehicle-filter.util';
import { computeInventoryKpis } from '../domain/inventory-kpi.util';
import { VehicleService } from './vehicle.service';
import { VehicleActionService } from './vehicle-action.service';

interface VehicleState {
  vehicles: Vehicle[];
  actions: VehicleAction[];
  filter: VehicleFilter;
  loading: boolean;
  error: string | null;
}

const initialState: VehicleState = {
  vehicles: [],
  actions: [],
  filter: EMPTY_VEHICLE_FILTER,
  loading: false,
  error: null,
};

@Service()
export class VehicleStore {
  private readonly vehicleService = inject(VehicleService);
  private readonly actionService = inject(VehicleActionService);
  private readonly clock = inject(ClockService);

  private readonly state = signal<VehicleState>(initialState);
  // Bumped on every load() call; a response only commits to state if it's still the most
  // recent request in flight, guarding against out-of-order resolution when load() is
  // called again before a prior call's HTTP responses have arrived.
  private latestRequestId = 0;

  readonly vehicles = computed(() => this.state().vehicles);
  readonly actions = computed(() => this.state().actions);
  readonly filter = computed(() => this.state().filter);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  readonly enrichedVehicles = computed(() =>
    enrichVehicles(this.state().vehicles, this.state().actions, this.clock.now()),
  );
  readonly filteredVehicles = computed(() =>
    filterVehicles(this.enrichedVehicles(), this.state().filter),
  );
  readonly agingVehicles = computed(() => this.enrichedVehicles().filter((v) => v.isAging));
  readonly kpis = computed(() => computeInventoryKpis(this.enrichedVehicles()));

  readonly availableMakes = computed(() =>
    Array.from(new Set(this.state().vehicles.map((v) => v.make))).sort(),
  );
  readonly availableModels = computed(() => {
    const make = this.state().filter.make;
    const source = make ? this.state().vehicles.filter((v) => v.make === make) : this.state().vehicles;
    return Array.from(new Set(source.map((v) => v.model))).sort();
  });

  load(): void {
    const requestId = ++this.latestRequestId;
    this.state.update((s) => ({ ...s, loading: true, error: null }));

    forkJoin({
      vehicles: this.vehicleService.getVehicles(),
      actions: this.actionService.getAllActions(),
    }).subscribe({
      next: ({ vehicles, actions }) => {
        if (requestId !== this.latestRequestId) return; // superseded by a newer load()
        this.state.update((s) => ({ ...s, vehicles, actions, loading: false }));
      },
      error: (err: Error) => {
        if (requestId !== this.latestRequestId) return;
        this.state.update((s) => ({ ...s, loading: false, error: err.message }));
      },
    });
  }

  updateFilter(partial: Partial<VehicleFilter>): void {
    this.state.update((s) => ({ ...s, filter: { ...s.filter, ...partial } }));
  }

  logAction(input: NewVehicleAction): void {
    const optimisticId = `optimistic-${this.clock.now().getTime()}`;
    // Stamp createdAt here, client-side: json-server auto-generates `id` on POST but
    // does NOT stamp `createdAt`, and enrichVehicles()/latestActionFor() rely on that
    // field for ordering. The same createdAt is used for the optimistic entry and the
    // draft actually sent over HTTP, so ordering never depends on the server round-trip.
    const draft: VehicleActionDraft = { ...input, createdAt: this.clock.now().toISOString() };
    const optimisticAction: VehicleAction = { ...draft, id: optimisticId };

    this.state.update((s) => ({ ...s, actions: [...s.actions, optimisticAction], error: null }));

    this.actionService.logAction(draft).subscribe({
      next: (saved) =>
        this.state.update((s) => ({
          ...s,
          actions: s.actions.map((a) => (a.id === optimisticId ? saved : a)),
        })),
      error: (err: Error) =>
        this.state.update((s) => ({
          ...s,
          actions: s.actions.filter((a) => a.id !== optimisticId),
          error: err.message,
        })),
    });
  }
}
