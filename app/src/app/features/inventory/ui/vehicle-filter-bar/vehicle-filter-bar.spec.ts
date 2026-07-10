// app/src/app/features/inventory/ui/vehicle-filter-bar/vehicle-filter-bar.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { EMPTY_VEHICLE_FILTER } from '../../models/vehicle-filter.model';
import { VehicleFilterBar } from './vehicle-filter-bar';

describe('VehicleFilterBar', () => {
  let fixture: ComponentFixture<VehicleFilterBar>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [VehicleFilterBar],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(VehicleFilterBar);
    fixture.componentRef.setInput('filter', EMPTY_VEHICLE_FILTER);
    fixture.componentRef.setInput('makes', ['Ford', 'Toyota']);
    fixture.componentRef.setInput('models', ['Corolla', 'Focus']);
    await fixture.whenStable();
  });

  it('emits a partial filter update when the search box changes', async () => {
    const emitted: Partial<typeof EMPTY_VEHICLE_FILTER>[] = [];
    fixture.componentInstance.filterChange.subscribe((v) => emitted.push(v));

    const input = fixture.debugElement.query(By.css('input[data-testid="search-input"]'))
      .nativeElement as HTMLInputElement;
    input.value = 'corolla';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(emitted).toEqual([{ search: 'corolla' }]);
  });

  it('emits agingOnly=true when the aging-only toggle is checked', async () => {
    const emitted: Partial<typeof EMPTY_VEHICLE_FILTER>[] = [];
    fixture.componentInstance.filterChange.subscribe((v) => emitted.push(v));

    const toggle = fixture.debugElement.query(By.css('[data-testid="aging-only-toggle"]'))
      .nativeElement as HTMLInputElement;
    toggle.click();
    await fixture.whenStable();

    expect(emitted).toContainEqual({ agingOnly: true });
  });

  it('emits a make filter when a make is selected, and null when cleared', async () => {
    const emitted: Partial<typeof EMPTY_VEHICLE_FILTER>[] = [];
    fixture.componentInstance.filterChange.subscribe((v) => emitted.push(v));

    const select = fixture.debugElement.query(By.css('select[data-testid="make-select"]'))
      .nativeElement as HTMLSelectElement;
    select.value = 'Ford';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(emitted).toContainEqual({ make: 'Ford' });

    select.value = '';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(emitted).toContainEqual({ make: null });
  });

  it('emits a model filter when a model is selected', async () => {
    const emitted: Partial<typeof EMPTY_VEHICLE_FILTER>[] = [];
    fixture.componentInstance.filterChange.subscribe((v) => emitted.push(v));

    const select = fixture.debugElement.query(By.css('select[data-testid="model-select"]'))
      .nativeElement as HTMLSelectElement;
    select.value = 'Corolla';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(emitted).toContainEqual({ model: 'Corolla' });
  });
});
