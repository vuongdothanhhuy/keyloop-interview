// app/src/app/features/inventory/data-access/vehicle-action.service.ts
import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { VehicleAction, VehicleActionDraft } from '../models/vehicle-action.model';

@Service()
export class VehicleActionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/vehicleActions';

  getAllActions(): Observable<VehicleAction[]> {
    return this.http.get<VehicleAction[]>(this.baseUrl);
  }

  logAction(input: VehicleActionDraft): Observable<VehicleAction> {
    return this.http.post<VehicleAction>(this.baseUrl, input);
  }
}
