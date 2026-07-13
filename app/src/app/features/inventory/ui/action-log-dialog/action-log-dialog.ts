// app/src/app/features/inventory/ui/action-log-dialog/action-log-dialog.ts
import { Component, inject, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NewVehicleAction, VEHICLE_ACTION_LABELS, VehicleActionType } from '../../models/vehicle-action.model';

export interface ActionLogDialogData {
  vehicleId: string;
  loggedBy: string;
}

@Component({
  selector: 'app-action-log-dialog',
  imports: [FormField, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Log an Action</h2>
    <mat-dialog-content class="dialog-form">
      <mat-form-field appearance="outline">
        <mat-label>Action</mat-label>
        <select matNativeControl [formField]="actionForm.actionType">
          <option value="">Select an action…</option>
          @for (entry of actionOptions; track entry.value) {
            <option [value]="entry.value">{{ entry.label }}</option>
          }
        </select>
        @if (actionForm.actionType().touched() && actionForm.actionType().errors().length) {
          <mat-error>{{ actionForm.actionType().errors()[0].message }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Note</mat-label>
        <textarea matInput [formField]="actionForm.note" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="actionForm().invalid()" (click)="save()">
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 320px;
    }
  `,
})
export class ActionLogDialog {
  readonly dialogRef = inject(MatDialogRef<ActionLogDialog, NewVehicleAction>);
  private readonly data = inject<ActionLogDialogData>(MAT_DIALOG_DATA);

  readonly actionOptions = (Object.entries(VEHICLE_ACTION_LABELS) as [VehicleActionType, string][]).map(
    ([value, label]) => ({ value, label }),
  );

  // Signal Forms model: never null (per docs/best-practices.md / the signal-forms skill rule) —
  // '' is the "unset" sentinel, rejected by the required() validator below.
  // Not `protected`: the spec sets it directly to drive the form without simulating DOM events.
  readonly formModel = signal<{ actionType: VehicleActionType | ''; note: string }>({
    actionType: '',
    note: '',
  });

  protected readonly actionForm = form(this.formModel, (schemaPath) => {
    required(schemaPath.actionType, { message: 'Please select an action' });
  });

  // submit() resolves Promise<boolean> (whether submission proceeded past validation),
  // not Promise<void> — verified against the published @angular/forms@22.0.6 signal-forms
  // .d.ts, which the plan's original Promise<void> annotation predates.
  save(): Promise<boolean> {
    return submit(this.actionForm, async () => {
      const { actionType, note } = this.formModel();
      this.dialogRef.close({
        vehicleId: this.data.vehicleId,
        actionType: actionType as VehicleActionType,
        note,
        loggedBy: this.data.loggedBy,
      });
    });
  }
}
