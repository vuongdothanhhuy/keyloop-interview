// app/src/app/features/inventory/ui/vehicle-filter-bar/vehicle-filter-bar.ts
import { Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { VehicleFilter } from '../../models/vehicle-filter.model';

@Component({
  selector: 'app-vehicle-filter-bar',
  imports: [MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatIconModule],
  template: `
    <div class="filter-bar">
      <mat-form-field class="filter-search" appearance="outline" subscriptSizing="dynamic">
        <mat-label>Search make, model, VIN</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input
          matInput
          data-testid="search-input"
          [value]="filter().search"
          (input)="filterChange.emit({ search: $any($event.target).value })"
        />
      </mat-form-field>

      <mat-form-field class="filter-select" appearance="outline" subscriptSizing="dynamic">
        <mat-label>Make</mat-label>
        <select
          matNativeControl
          data-testid="make-select"
          [value]="filter().make ?? ''"
          (change)="filterChange.emit({ make: $any($event.target).value || null })"
        >
          <option value="">All makes</option>
          @for (make of makes(); track make) {
            <option [value]="make">{{ make }}</option>
          }
        </select>
      </mat-form-field>

      <mat-form-field class="filter-select" appearance="outline" subscriptSizing="dynamic">
        <mat-label>Model</mat-label>
        <select
          matNativeControl
          data-testid="model-select"
          [value]="filter().model ?? ''"
          (change)="filterChange.emit({ model: $any($event.target).value || null })"
        >
          <option value="">All models</option>
          @for (model of models(); track model) {
            <option [value]="model">{{ model }}</option>
          }
        </select>
      </mat-form-field>

      <mat-slide-toggle
        class="filter-toggle"
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
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem 1.25rem;
      background: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 14px;
    }
    .filter-search {
      flex: 1 1 260px;
      min-width: 220px;
    }
    .filter-search mat-icon {
      color: var(--mat-sys-on-surface-variant);
    }
    .filter-select {
      flex: 0 0 180px;
    }
    .filter-toggle {
      margin-left: auto;
    }
  `,
})
export class VehicleFilterBar {
  readonly filter = input.required<VehicleFilter>();
  readonly makes = input.required<string[]>();
  readonly models = input.required<string[]>();
  readonly filterChange = output<Partial<VehicleFilter>>();
}
