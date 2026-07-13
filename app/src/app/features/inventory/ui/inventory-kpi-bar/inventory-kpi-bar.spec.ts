import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { InventoryKpiBar } from './inventory-kpi-bar';

describe('InventoryKpiBar', () => {
  let fixture: ComponentFixture<InventoryKpiBar>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [InventoryKpiBar],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(InventoryKpiBar);
    fixture.componentRef.setInput('kpis', {
      totalVehicles: 130,
      agingCount: 36,
      agingPercentage: 27.7,
      averageAgeDays: 74,
    });
    await fixture.whenStable();
  });

  it('displays the total vehicle count', () => {
    expect(fixture.nativeElement.textContent).toContain('130');
  });

  it('displays the aging count and percentage together', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('36');
    expect(text).toContain('27.7');
  });

  it('displays the average age in days', () => {
    expect(fixture.nativeElement.textContent).toContain('74');
  });
});
