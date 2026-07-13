// app/src/app/features/inventory/ui/action-log-dialog/action-log-dialog.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActionLogDialog } from './action-log-dialog';

describe('ActionLogDialog', () => {
  let fixture: ComponentFixture<ActionLogDialog>;
  const closeSpy = vi.fn();

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ActionLogDialog],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialogRef, useValue: { close: closeSpy } },
        { provide: MAT_DIALOG_DATA, useValue: { vehicleId: 'V1', loggedBy: 'Alex Manager' } },
      ],
    });
    fixture = TestBed.createComponent(ActionLogDialog);
    await fixture.whenStable();
  });

  it('does not close the dialog when submitting with no action type selected', async () => {
    await fixture.componentInstance.save();
    await fixture.whenStable();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('closes the dialog with the composed NewVehicleAction once a valid action type and note are set', async () => {
    fixture.componentInstance.formModel.set({
      actionType: 'price_reduction_planned',
      note: 'Reduce $500',
    });
    await fixture.componentInstance.save();
    await fixture.whenStable();

    expect(closeSpy).toHaveBeenCalledWith({
      vehicleId: 'V1',
      actionType: 'price_reduction_planned',
      note: 'Reduce $500',
      loggedBy: 'Alex Manager',
    });
  });
});
