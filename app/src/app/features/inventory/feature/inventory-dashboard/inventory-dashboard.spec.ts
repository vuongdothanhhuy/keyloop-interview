// app/src/app/features/inventory/feature/inventory-dashboard/inventory-dashboard.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { InventoryDashboard } from './inventory-dashboard';
import { VehicleStore } from '../../data-access/vehicle.store';

describe('InventoryDashboard', () => {
  let fixture: ComponentFixture<InventoryDashboard>;
  const loadSpy = vi.fn();
  const updateFilterSpy = vi.fn();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InventoryDashboard],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: VehicleStore,
          useValue: {
            load: loadSpy,
            updateFilter: updateFilterSpy,
            loading: signal(false),
            error: signal(null),
            filter: signal({ search: '', make: null, model: null, status: null, agingOnly: false }),
            filteredVehicles: signal([
              {
                id: 'V1', vin: 'V1', make: 'Toyota', model: 'Corolla', trim: 'Base', year: 2024,
                color: 'Blue', bodyType: 'Sedan', fuelType: 'Petrol', mileage: 1000, price: 20000,
                dealershipId: 'DEALER-001', intakeDate: '2026-01-01', status: 'in_stock',
                imageUrl: 'https://picsum.photos/seed/V1/400/300', imageWidth: 400, imageHeight: 300,
                ageDays: 190, severity: 'critical', isAging: true,
              },
            ]),
            kpis: signal({ totalVehicles: 1, agingCount: 1, agingPercentage: 100, averageAgeDays: 190 }),
            availableMakes: signal(['Toyota']),
            availableModels: signal(['Corolla']),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(InventoryDashboard);
  });

  it('calls store.load() on init', async () => {
    await fixture.whenStable();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('renders one row per filtered vehicle', async () => {
    await fixture.whenStable();
    const rows = fixture.nativeElement.querySelectorAll('[data-testid="vehicle-row"]');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Corolla');
  });

  it('forwards filter-bar changes to store.updateFilter', async () => {
    await fixture.whenStable();
    fixture.componentInstance.onFilterChange({ agingOnly: true });
    expect(updateFilterSpy).toHaveBeenCalledWith({ agingOnly: true });
  });

  it('gives the photo and actions columns an accessible (non-visual) label', async () => {
    await fixture.whenStable();
    const headerCells = fixture.nativeElement.querySelectorAll('th');
    expect(headerCells[0].textContent?.trim()).toBe('Photo');
    expect(headerCells[headerCells.length - 1].textContent?.trim()).toBe('Actions');
  });

  it('gives the loading spinner an accessible label', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [InventoryDashboard],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: VehicleStore,
          useValue: {
            load: vi.fn(),
            updateFilter: vi.fn(),
            loading: signal(true),
            error: signal(null),
            filter: signal({ search: '', make: null, model: null, status: null, agingOnly: false }),
            filteredVehicles: signal([]),
            kpis: signal({ totalVehicles: 0, agingCount: 0, agingPercentage: 0, averageAgeDays: 0 }),
            availableMakes: signal([]),
            availableModels: signal([]),
          },
        },
      ],
    });
    const loadingFixture = TestBed.createComponent(InventoryDashboard);
    await loadingFixture.whenStable();

    const spinner = loadingFixture.nativeElement.querySelector('mat-spinner');
    expect(spinner?.getAttribute('aria-label')).toBe('Loading inventory');
    expect(spinner?.getAttribute('role')).toBe('status');
  });
});
