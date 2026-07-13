// app/src/app/features/inventory/data-access/vehicle-action.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VehicleActionService } from './vehicle-action.service';
import { VehicleAction, VehicleActionDraft } from '../models/vehicle-action.model';

describe('VehicleActionService', () => {
  let service: VehicleActionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VehicleActionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GETs /api/vehicleActions and returns all actions', () => {
    const mockActions: VehicleAction[] = [
      {
        id: 'a1',
        vehicleId: 'V1',
        actionType: 'manager_review',
        note: 'note',
        loggedBy: 'Alex',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
    ];

    let result: VehicleAction[] | undefined;
    service.getAllActions().subscribe((a) => (result = a));

    const req = httpMock.expectOne('/api/vehicleActions');
    expect(req.request.method).toBe('GET');
    req.flush(mockActions);

    expect(result).toEqual(mockActions);
  });

  it('POSTs a new action to /api/vehicleActions', () => {
    const input: VehicleActionDraft = {
      vehicleId: 'V1',
      actionType: 'price_reduction_planned',
      note: 'Reduce by $500',
      loggedBy: 'Alex Manager',
      createdAt: '2026-07-09T00:00:00.000Z', // stamped client-side by VehicleStore, not by json-server
    };
    const created: VehicleAction = { ...input, id: 'a99' };

    let result: VehicleAction | undefined;
    service.logAction(input).subscribe((a) => (result = a));

    const req = httpMock.expectOne('/api/vehicleActions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush(created);

    expect(result).toEqual(created);
  });
});
