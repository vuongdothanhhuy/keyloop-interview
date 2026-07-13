// app/src/app/features/inventory/feature/vehicle-detail/vehicle-detail.ts
import { Component, OnInit, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AgingBadge } from '../../ui/aging-badge/aging-badge';
import { ActionLogDialog } from '../../ui/action-log-dialog/action-log-dialog';
import { VehicleStore } from '../../data-access/vehicle.store';
import { CurrentUserService } from '../../../../core/current-user.service';
import { VEHICLE_ACTION_LABELS } from '../../models/vehicle-action.model';

@Component({
  selector: 'app-vehicle-detail',
  imports: [
    NgOptimizedImage,
    CurrencyPipe,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AgingBadge,
  ],
  template: `
    <a routerLink="/inventory" class="back-link">
      <mat-icon>arrow_back</mat-icon>
      <span>Back to inventory</span>
    </a>

    @if (store.loading()) {
      <mat-spinner diameter="32" aria-label="Loading vehicle" role="status" />
    } @else if (store.error(); as error) {
      <p class="error" role="alert">Couldn't load vehicle: {{ error }}</p>
    } @else if (vehicle(); as v) {
      <section class="detail-card">
        <img
          [ngSrc]="v.imageUrl"
          [width]="v.imageWidth"
          [height]="v.imageHeight"
          priority
          class="detail-photo"
          alt="{{ v.year }} {{ v.make }} {{ v.model }}"
        />
        <div class="detail-summary">
          <div class="detail-title">
            <h1>{{ v.make }} {{ v.model }} <span class="detail-year">({{ v.year }})</span></h1>
            <app-aging-badge [severity]="v.severity" [ageDays]="v.ageDays" />
          </div>

          <dl class="detail-meta">
            <div>
              <dt>VIN</dt>
              <dd class="detail-vin">{{ v.vin }}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{{ v.status.replaceAll('_', ' ') }}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{{ v.price | currency }}</dd>
            </div>
            <div>
              <dt>Days in stock</dt>
              <dd>{{ v.ageDays }}</dd>
            </div>
          </dl>

          <button mat-flat-button color="primary" (click)="openLogActionDialog()">
            <mat-icon>edit_note</mat-icon>
            Log Action
          </button>
        </div>
      </section>

      <section class="history">
        <h2>Action History</h2>
        @if (history().length === 0) {
          <p class="empty-state">No actions logged yet.</p>
        } @else {
          <ul class="history-list">
            @for (action of history(); track action.id) {
              <li>
                <span class="history-type">{{ actionLabels[action.actionType] }}</span>
                <span class="history-note">{{ action.note }}</span>
                <span class="history-date">{{ action.createdAt | date: 'medium' }}</span>
              </li>
            }
          </ul>
        }
      </section>
    } @else {
      <p class="empty-state">Vehicle not found.</p>
    }
  `,
  styles: `
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin-bottom: 1.25rem;
      color: var(--mat-sys-on-surface-variant);
      text-decoration: none;
      font-size: 0.9rem;
    }
    .back-link:hover {
      color: var(--mat-sys-primary);
    }
    .back-link mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .detail-card {
      display: flex;
      gap: 1.75rem;
      align-items: flex-start;
      flex-wrap: wrap;
      padding: 1.5rem;
      margin-bottom: 2rem;
      background: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
      box-shadow: var(--mat-sys-level1);
    }
    .detail-photo {
      width: 340px;
      max-width: 100%;
      height: auto;
      border-radius: 12px;
    }
    .detail-summary {
      flex: 1 1 320px;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .detail-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .detail-title h1 {
      margin: 0;
      font-size: 1.75rem;
    }
    .detail-year {
      color: var(--mat-sys-on-surface-variant);
      font-weight: 400;
    }
    .detail-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem 1.5rem;
      margin: 0;
    }
    .detail-meta dt {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 0.2rem;
    }
    .detail-meta dd {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
      text-transform: capitalize;
    }
    .detail-vin {
      font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
      font-size: 0.9rem;
      text-transform: none;
    }
    .detail-summary button {
      align-self: flex-start;
    }
    .detail-summary button mat-icon {
      margin-right: 0.25rem;
    }
    .history h2 {
      font-size: 1.15rem;
      margin: 0 0 1rem;
    }
    .empty-state {
      color: var(--mat-sys-on-surface-variant);
    }
    .history-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .history-list li {
      display: flex;
      align-items: baseline;
      gap: 0.85rem;
      padding: 0.85rem 1rem;
      background: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 10px;
    }
    .history-type {
      font-weight: 600;
      white-space: nowrap;
    }
    .history-note {
      flex: 1;
      color: var(--mat-sys-on-surface-variant);
    }
    .history-date {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.82rem;
      white-space: nowrap;
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
