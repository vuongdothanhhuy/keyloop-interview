// app/src/app/features/inventory/feature/vehicle-detail/vehicle-detail.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { VehicleDetail } from './vehicle-detail';
import { VehicleStore } from '../../data-access/vehicle.store';
import { CurrentUserService } from '../../../../core/current-user.service';

describe('VehicleDetail', () => {
  let fixture: ComponentFixture<VehicleDetail>;
  const logActionSpy = vi.fn();

  const vehicle = {
    id: 'V1', vin: 'V1', make: 'Toyota', model: 'Corolla', trim: 'Base', year: 2024,
    color: 'Blue', bodyType: 'Sedan', fuelType: 'Petrol', mileage: 1000, price: 20000,
    dealershipId: 'DEALER-001', intakeDate: '2026-01-01', status: 'in_stock',
    imageUrl: 'https://picsum.photos/seed/V1/400/300', imageWidth: 400, imageHeight: 300,
    ageDays: 190, severity: 'critical', isAging: true,
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [VehicleDetail],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'V1' } } } },
        {
          provide: VehicleStore,
          useValue: {
            load: vi.fn(),
            logAction: logActionSpy,
            loading: signal(false),
            error: signal(null),
            enrichedVehicles: signal([vehicle]),
            actions: signal([
              { id: 'a1', vehicleId: 'V1', actionType: 'manager_review', note: 'first look', loggedBy: 'Alex Manager', createdAt: '2026-06-01T00:00:00.000Z' },
            ]),
          },
        },
        { provide: CurrentUserService, useValue: { currentUser: signal({ name: 'Alex Manager', role: 'manager' }) } },
        {
          provide: MatDialog,
          useValue: { open: () => ({ afterClosed: () => of({ vehicleId: 'V1', actionType: 'price_reduction_planned', note: 'n', loggedBy: 'Alex Manager' }) }) },
        },
      ],
    });
    fixture = TestBed.createComponent(VehicleDetail);
    await fixture.whenStable();
  });

  it('shows the vehicle make/model and full action history', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Corolla');
    expect(text).toContain('first look');
  });

  it('renders the vehicle photo via NgOptimizedImage', () => {
    const img = fixture.nativeElement.querySelector('img');
    expect(img?.getAttribute('ng-img')).not.toBeNull();
  });

  it('calls store.logAction with the dialog result when the dialog closes with a value', async () => {
    fixture.componentInstance.openLogActionDialog();
    await fixture.whenStable();
    expect(logActionSpy).toHaveBeenCalledWith({
      vehicleId: 'V1', actionType: 'price_reduction_planned', note: 'n', loggedBy: 'Alex Manager',
    });
  });

  it('shows a loading indicator instead of "Vehicle not found" while the store is still loading', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [VehicleDetail],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'V1' } } } },
        {
          provide: VehicleStore,
          useValue: {
            load: vi.fn(),
            logAction: vi.fn(),
            loading: signal(true),
            error: signal(null),
            enrichedVehicles: signal([]), // not loaded yet — must not be mistaken for "doesn't exist"
            actions: signal([]),
          },
        },
        { provide: CurrentUserService, useValue: { currentUser: signal({ name: 'Alex Manager', role: 'manager' }) } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
      ],
    });
    const loadingFixture = TestBed.createComponent(VehicleDetail);
    await loadingFixture.whenStable();

    const text = loadingFixture.nativeElement.textContent;
    expect(text).not.toContain('Vehicle not found');
    expect(loadingFixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();
  });

  it('shows an error message instead of "Vehicle not found" when the load fails', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [VehicleDetail],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'V1' } } } },
        {
          provide: VehicleStore,
          useValue: {
            load: vi.fn(),
            logAction: vi.fn(),
            loading: signal(false),
            error: signal('network down'),
            enrichedVehicles: signal([]),
            actions: signal([]),
          },
        },
        { provide: CurrentUserService, useValue: { currentUser: signal({ name: 'Alex Manager', role: 'manager' }) } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
      ],
    });
    const errorFixture = TestBed.createComponent(VehicleDetail);
    await errorFixture.whenStable();

    const text = errorFixture.nativeElement.textContent;
    expect(text).not.toContain('Vehicle not found');
    expect(text).toContain('network down');
  });

  it('shows "Vehicle not found" only once loading has finished, there is no error, and the vehicle truly does not exist', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [VehicleDetail],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'NOT-A-REAL-VIN' } } } },
        {
          provide: VehicleStore,
          useValue: {
            load: vi.fn(),
            logAction: vi.fn(),
            loading: signal(false),
            error: signal(null),
            enrichedVehicles: signal([vehicle]), // loaded, but doesn't include the requested vin
            actions: signal([]),
          },
        },
        { provide: CurrentUserService, useValue: { currentUser: signal({ name: 'Alex Manager', role: 'manager' }) } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
      ],
    });
    const notFoundFixture = TestBed.createComponent(VehicleDetail);
    await notFoundFixture.whenStable();

    expect(notFoundFixture.nativeElement.textContent).toContain('Vehicle not found');
  });
});
