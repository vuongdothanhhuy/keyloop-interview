import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { InventoryKpis } from '../../domain/inventory-kpi.util';

@Component({
  selector: 'app-inventory-kpi-bar',
  imports: [MatCardModule],
  template: `
    <div class="kpi-bar">
      <mat-card class="kpi-card">
        <span class="kpi-value">{{ kpis().totalVehicles }}</span>
        <span class="kpi-label">Total Vehicles</span>
      </mat-card>
      <mat-card class="kpi-card kpi-card--aging">
        <span class="kpi-value">{{ kpis().agingCount }}</span>
        <span class="kpi-label">Aging Stock ({{ kpis().agingPercentage }}%)</span>
      </mat-card>
      <mat-card class="kpi-card">
        <span class="kpi-value">{{ kpis().averageAgeDays }}</span>
        <span class="kpi-label">Avg. Days in Stock</span>
      </mat-card>
    </div>
  `,
  styles: `
    .kpi-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .kpi-card {
      display: flex;
      flex-direction: column;
      padding: 1rem 1.5rem;
      min-width: 160px;
    }
    .kpi-card--aging {
      border-left: 4px solid #d32f2f;
    }
    .kpi-value {
      font-size: 2rem;
      font-weight: 600;
    }
    .kpi-label {
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.85rem;
    }
  `,
})
export class InventoryKpiBar {
  readonly kpis = input.required<InventoryKpis>();
}
