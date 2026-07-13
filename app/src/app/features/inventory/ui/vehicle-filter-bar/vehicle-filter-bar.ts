// app/src/app/features/inventory/ui/vehicle-filter-bar/vehicle-filter-bar.ts
import { Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { VehicleFilter } from '../../models/vehicle-filter.model';

@Component({
  selector: 'app-vehicle-filter-bar',
  imports: [MatFormFieldModule, MatInputModule, MatSlideToggleModule],
  template: `
    <div class="filter-bar">
      <mat-form-field appearance="outline">
        <mat-label>Search make, model, VIN</mat-label>
        <input
          matInput
          data-testid="search-input"
          [value]="filter().search"
          (input)="filterChange.emit({ search: $any($event.target).value })"
        />
      </mat-form-field>

      <label>
        Make
        <select
          data-testid="make-select"
          [value]="filter().make ?? ''"
          (change)="filterChange.emit({ make: $any($event.target).value || null })"
        >
          <option value="">All makes</option>
          @for (make of makes(); track make) {
            <option [value]="make">{{ make }}</option>
          }
        </select>
      </label>

      <label>
        Model
        <select
          data-testid="model-select"
          [value]="filter().model ?? ''"
          (change)="filterChange.emit({ model: $any($event.target).value || null })"
        >
          <option value="">All models</option>
          @for (model of models(); track model) {
            <option [value]="model">{{ model }}</option>
          }
        </select>
      </label>

      <mat-slide-toggle
        data-testid="aging-only-toggle"
        [checked]="filter().agingOnly"
        (change)="filterChange.emit({ agingOnly: $event.checked })"
      >
        Aging stock only (&gt;90 days)
      </mat-slide-toggle>
    </div>
  `,
  styles: `
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1rem;
    }
  `,
})
export class VehicleFilterBar {
  readonly filter = input.required<VehicleFilter>();
  readonly makes = input.required<string[]>();
  readonly models = input.required<string[]>();
  readonly filterChange = output<Partial<VehicleFilter>>();
}
