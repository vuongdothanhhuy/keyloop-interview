import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AgingBadge } from './aging-badge';

describe('AgingBadge', () => {
  let fixture: ComponentFixture<AgingBadge>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AgingBadge],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(AgingBadge);
  });

  it('renders the "Critical" label and applies the critical CSS class for severity=critical', async () => {
    fixture.componentRef.setInput('severity', 'critical');
    fixture.componentRef.setInput('ageDays', 200);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Critical');
    expect(el.textContent).toContain('200');
    expect(el.querySelector('.severity-critical')).toBeTruthy();
  });

  it('renders the "Fresh" label for severity=fresh', async () => {
    fixture.componentRef.setInput('severity', 'fresh');
    fixture.componentRef.setInput('ageDays', 5);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Fresh');
  });
});
