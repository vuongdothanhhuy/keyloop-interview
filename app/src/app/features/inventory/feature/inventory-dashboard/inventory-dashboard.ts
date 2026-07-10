// app/src/app/features/inventory/feature/inventory-dashboard/inventory-dashboard.ts
import { Component, OnInit, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AgingBadge } from '../../ui/aging-badge/aging-badge';
import { InventoryKpiBar } from '../../ui/inventory-kpi-bar/inventory-kpi-bar';
import { VehicleFilterBar } from '../../ui/vehicle-filter-bar/vehicle-filter-bar';
import { VehicleStore } from '../../data-access/vehicle.store';
import { VehicleFilter } from '../../models/vehicle-filter.model';

@Component({
  selector: 'app-inventory-dashboard',
  imports: [
    RouterLink,
    NgOptimizedImage,
    MatButtonModule,
    MatProgressSpinnerModule,
    AgingBadge,
    InventoryKpiBar,
    VehicleFilterBar,
  ],
  template: `
    <app-inventory-kpi-bar [kpis]="store.kpis()" />
    <app-vehicle-filter-bar
      [filter]="store.filter()"
      [makes]="store.availableMakes()"
      [models]="store.availableModels()"
      (filterChange)="onFilterChange($event)"
    />

    @if (store.loading()) {
      <mat-spinner diameter="32" />
    } @else if (store.error(); as error) {
      <p class="error" role="alert">Couldn't load inventory: {{ error }}</p>
    } @else if (store.filteredVehicles().length === 0) {
      <p>No vehicles match the current filters.</p>
    } @else {
      <table>
        <thead>
          <tr><th></th><th>VIN</th><th>Make</th><th>Model</th><th>Age</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          @for (vehicle of store.filteredVehicles(); track vehicle.id) {
            <tr data-testid="vehicle-row">
              <td>
                <img
                  [ngSrc]="vehicle.imageUrl"
                  [width]="vehicle.imageWidth"
                  [height]="vehicle.imageHeight"
                  class="thumb"
                  alt="{{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}"
                />
              </td>
              <td>{{ vehicle.vin }}</td>
              <td>{{ vehicle.make }}</td>
              <td>{{ vehicle.model }}</td>
              <td><app-aging-badge [severity]="vehicle.severity" [ageDays]="vehicle.ageDays" /></td>
              <td>{{ vehicle.status }}</td>
              <td>
                <a mat-button [routerLink]="['/inventory', vehicle.vin]">View / Log Action</a>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: `
    .thumb {
      width: 64px;
      height: auto;
      border-radius: 4px;
    }
  `,
})
export class InventoryDashboard implements OnInit {
  protected readonly store = inject(VehicleStore);

  ngOnInit(): void {
    this.store.load();
  }

  onFilterChange(partial: Partial<VehicleFilter>): void {
    this.store.updateFilter(partial);
  }
}
