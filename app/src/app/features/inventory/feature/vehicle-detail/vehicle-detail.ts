// app/src/app/features/inventory/feature/vehicle-detail/vehicle-detail.ts
import { Component, OnInit, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AgingBadge } from '../../ui/aging-badge/aging-badge';
import { ActionLogDialog } from '../../ui/action-log-dialog/action-log-dialog';
import { VehicleStore } from '../../data-access/vehicle.store';
import { CurrentUserService } from '../../../../core/current-user.service';
import { VEHICLE_ACTION_LABELS } from '../../models/vehicle-action.model';

@Component({
  selector: 'app-vehicle-detail',
  imports: [NgOptimizedImage, CurrencyPipe, DatePipe, MatButtonModule, AgingBadge],
  template: `
    @if (vehicle(); as v) {
      <h1>{{ v.make }} {{ v.model }} ({{ v.year }})</h1>
      <img
        [ngSrc]="v.imageUrl"
        [width]="v.imageWidth"
        [height]="v.imageHeight"
        priority
        alt="{{ v.year }} {{ v.make }} {{ v.model }}"
      />
      <app-aging-badge [severity]="v.severity" [ageDays]="v.ageDays" />
      <p>VIN: {{ v.vin }} · Status: {{ v.status }} · Price: {{ v.price | currency }}</p>

      <button mat-flat-button color="primary" (click)="openLogActionDialog()">Log Action</button>

      <h2>Action History</h2>
      @if (history().length === 0) {
        <p>No actions logged yet.</p>
      } @else {
        <ul>
          @for (action of history(); track action.id) {
            <li>{{ action.createdAt | date: 'medium' }} — {{ actionLabels[action.actionType] }}: {{ action.note }}</li>
          }
        </ul>
      }
    } @else {
      <p>Vehicle not found.</p>
    }
  `,
})
export class VehicleDetail implements OnInit {
  protected readonly store = inject(VehicleStore);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly currentUser = inject(CurrentUserService);
  protected readonly actionLabels = VEHICLE_ACTION_LABELS;

  private readonly vin = this.route.snapshot.paramMap.get('vin')!;

  readonly vehicle = computed(() => this.store.enrichedVehicles().find((v) => v.vin === this.vin));
  readonly history = computed(() =>
    this.store
      .actions()
      .filter((a) => a.vehicleId === this.vin)
      .sort((a, b) => {
        const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        // Same tie-break as latestActionFor() (Task 9): id comparison when createdAt matches.
        return diff !== 0 ? diff : b.id.localeCompare(a.id, undefined, { numeric: true });
      }),
  );

  ngOnInit(): void {
    this.store.load();
  }

  openLogActionDialog(): void {
    this.dialog
      .open(ActionLogDialog, {
        data: { vehicleId: this.vin, loggedBy: this.currentUser.currentUser().name },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.store.logAction(result);
      });
  }
}
