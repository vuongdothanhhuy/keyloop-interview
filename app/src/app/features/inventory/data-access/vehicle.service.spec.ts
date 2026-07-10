// app/src/app/features/inventory/data-access/vehicle.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VehicleService } from './vehicle.service';
import { Vehicle } from '../models/vehicle.model';

describe('VehicleService', () => {
  let service: VehicleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VehicleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GETs /api/vehicles and returns the vehicle list', () => {
    const mockVehicles: Vehicle[] = [
      {
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
        intakeDate: '2026-01-01',
        status: 'in_stock',
        imageUrl: '',
        imageWidth: 400,
        imageHeight: 300,
      },
    ];

    let result: Vehicle[] | undefined;
    service.getVehicles().subscribe((v) => (result = v));

    const req = httpMock.expectOne('/api/vehicles');
    expect(req.request.method).toBe('GET');
    req.flush(mockVehicles);

    expect(result).toEqual(mockVehicles);
  });
});
