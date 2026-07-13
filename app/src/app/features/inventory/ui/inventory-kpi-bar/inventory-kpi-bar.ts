import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { InventoryKpis } from '../../domain/inventory-kpi.util';

@Component({
  selector: 'app-inventory-kpi-bar',
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="kpi-bar">
      <mat-card class="kpi-card kpi-card--neutral" appearance="outlined">
        <span class="kpi-icon"><mat-icon>directions_car</mat-icon></span>
        <span class="kpi-body">
          <span class="kpi-value">{{ kpis().totalVehicles }}</span>
          <span class="kpi-label">Total Vehicles</span>
        </span>
      </mat-card>
      <mat-card class="kpi-card kpi-card--aging" appearance="outlined">
        <span class="kpi-icon"><mat-icon>schedule</mat-icon></span>
        <span class="kpi-body">
          <span class="kpi-value">{{ kpis().agingCount }}</span>
          <span class="kpi-label">Aging Stock ({{ kpis().agingPercentage }}%)</span>
        </span>
      </mat-card>
      <mat-card class="kpi-card kpi-card--tertiary" appearance="outlined">
        <span class="kpi-icon"><mat-icon>trending_up</mat-icon></span>
        <span class="kpi-body">
          <span class="kpi-value">{{ kpis().averageAgeDays }}</span>
          <span class="kpi-label">Avg. Days in Stock</span>
        </span>
      </mat-card>
    </div>
  `,
  styles: `
    .kpi-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .kpi-card {
      /* mat-card sets flex-direction: column on its host; force a row so the
         icon sits beside the metric rather than stacked above it. */
      flex-direction: row;
      align-items: center;
      gap: 1.1rem;
      padding: 1.25rem 1.5rem;
      border-radius: 14px;
      background: var(--mat-sys-surface);
      transition:
        transform 0.15s ease,
        box-shadow 0.15s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--mat-sys-level2);
    }
    .kpi-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .kpi-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .kpi-card--neutral .kpi-icon {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    .kpi-card--aging .kpi-icon {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }
    .kpi-card--tertiary .kpi-icon {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }
    .kpi-body {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .kpi-value {
      font-size: 2.1rem;
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: -0.01em;
    }
    .kpi-label {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.85rem;
    }
  `,
})
export class InventoryKpiBar {
  readonly kpis = input.required<InventoryKpis>();
}
