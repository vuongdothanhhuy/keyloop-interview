import { Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { AgingSeverity } from '../../domain/inventory-age.util';

const LABELS: Record<AgingSeverity, string> = {
  fresh: 'Fresh',
  watch: 'Watch',
  aging: 'Aging',
  critical: 'Critical',
};

// mat-chip's elevated-container/label-text CSS custom properties, set per severity
// below — these are plain inherited CSS variables, so they cross Angular's emulated
// view encapsulation boundary into the chip's own template without needing ::ng-deep.
const COLORS: Record<AgingSeverity, { background: string; text: string }> = {
  fresh: { background: '#e6f4ea', text: '#1e7d34' },
  watch: { background: '#fff4e0', text: '#8a6100' },
  aging: { background: '#ffe3cc', text: '#b35900' },
  critical: { background: '#fdecea', text: '#c62828' },
};

@Component({
  selector: 'app-aging-badge',
  imports: [MatChipsModule],
  template: `
    <mat-chip
      [class]="'severity-' + severity()"
      [highlighted]="severity() !== 'fresh'"
      [style.--mat-chip-elevated-container-color]="color().background"
      [style.--mat-chip-label-text-color]="color().text"
    >
      {{ label() }} · {{ ageDays() }}d
    </mat-chip>
  `,
})
export class AgingBadge {
  readonly severity = input.required<AgingSeverity>();
  readonly ageDays = input.required<number>();
  readonly label = computed(() => LABELS[this.severity()]);
  readonly color = computed(() => COLORS[this.severity()]);
}
