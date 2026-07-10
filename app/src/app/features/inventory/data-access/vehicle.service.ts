// app/src/app/features/inventory/data-access/vehicle.service.ts
import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Vehicle } from '../models/vehicle.model';

@Service()
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/vehicles';

  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(this.baseUrl);
  }
}
