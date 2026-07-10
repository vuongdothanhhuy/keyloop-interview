import { ClockService } from './clock.service';

describe('ClockService', () => {
  it('returns a Date close to the real current time', () => {
    const clock = new ClockService();
    const before = Date.now();
    const now = clock.now();
    const after = Date.now();
    expect(now.getTime()).toBeGreaterThanOrEqual(before);
    expect(now.getTime()).toBeLessThanOrEqual(after);
  });
});
