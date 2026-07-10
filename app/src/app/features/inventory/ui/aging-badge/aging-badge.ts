import { Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { AgingSeverity } from '../../domain/inventory-age.util';

const LABELS: Record<AgingSeverity, string> = {
  fresh: 'Fresh',
  watch: 'Watch',
  aging: 'Aging',
  critical: 'Critical',
};

@Component({
  selector: 'app-aging-badge',
  imports: [MatChipsModule],
  template: `
    <mat-chip [class]="'severity-' + severity()" [highlighted]="severity() !== 'fresh'">
      {{ label() }} · {{ ageDays() }}d
    </mat-chip>
  `,
})
export class AgingBadge {
  readonly severity = input.required<AgingSeverity>();
  readonly ageDays = input.required<number>();
  readonly label = computed(() => LABELS[this.severity()]);
}
