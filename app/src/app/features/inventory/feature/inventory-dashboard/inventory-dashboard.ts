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
      <mat-spinner diameter="32" aria-label="Loading inventory" role="status" />
    } @else if (store.error(); as error) {
      <p class="error" role="alert">Couldn't load inventory: {{ error }}</p>
    } @else if (store.filteredVehicles().length === 0) {
      <p class="empty-state">No vehicles match the current filters.</p>
    } @else {
      <table class="inventory-table">
        <thead>
          <tr>
            <th><span class="visually-hidden">Photo</span></th>
            <th>VIN</th>
            <th>Make</th>
            <th>Model</th>
            <th>Age</th>
            <th>Status</th>
            <th><span class="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          @for (vehicle of store.filteredVehicles(); track vehicle.id) {
            <tr data-testid="vehicle-row">
              <td class="photo-cell">
                <img
                  [ngSrc]="vehicle.imageUrl"
                  [width]="vehicle.imageWidth"
                  [height]="vehicle.imageHeight"
                  class="thumb"
                  alt="{{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}"
                />
              </td>
              <td class="vin-cell">{{ vehicle.vin }}</td>
              <td>{{ vehicle.make }}</td>
              <td>{{ vehicle.model }}</td>
              <td><app-aging-badge [severity]="vehicle.severity" [ageDays]="vehicle.ageDays" /></td>
              <td class="status-cell">{{ vehicle.status.replaceAll('_', ' ') }}</td>
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
      display: block;
      width: 64px;
      height: 44px;
      object-fit: cover;
      border-radius: 6px;
      background: var(--mat-sys-surface-container-high);
    }
    .empty-state {
      color: var(--mat-sys-on-surface-variant);
      padding: 2rem 0;
      text-align: center;
    }
    .inventory-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: var(--mat-sys-level1);
    }
    .inventory-table th,
    .inventory-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      vertical-align: middle;
    }
    .inventory-table th {
      background: var(--mat-sys-surface-container);
      color: var(--mat-sys-on-surface-variant);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .inventory-table tbody tr {
      transition: background 0.12s ease;
    }
    .inventory-table tbody tr:hover {
      background: var(--mat-sys-surface-container-low);
    }
    .inventory-table tbody tr:last-child td {
      border-bottom: none;
    }
    .photo-cell {
      width: 64px;
      padding-right: 0;
    }
    .vin-cell {
      font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
      font-size: 0.85rem;
      letter-spacing: 0.01em;
    }
    .status-cell {
      text-transform: capitalize;
      color: var(--mat-sys-on-surface-variant);
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
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
