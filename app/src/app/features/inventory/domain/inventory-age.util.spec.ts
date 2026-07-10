// app/src/app/features/inventory/domain/inventory-age.util.spec.ts
import {
  AGING_THRESHOLD_DAYS,
  getAgingSeverity,
  getInventoryAgeDays,
  isAgingStock,
} from './inventory-age.util';

describe('getInventoryAgeDays', () => {
  const asOf = new Date('2026-07-09T00:00:00.000Z');

  it('returns 0 for a vehicle that arrived today', () => {
    expect(getInventoryAgeDays('2026-07-09', asOf)).toBe(0);
  });

  it('returns 90 for a vehicle that arrived exactly 90 days ago', () => {
    expect(getInventoryAgeDays('2026-04-10', asOf)).toBe(90);
  });

  it('returns 91 for a vehicle that arrived exactly 91 days ago', () => {
    expect(getInventoryAgeDays('2026-04-09', asOf)).toBe(91);
  });

  it('clamps a future intake date to 0 instead of going negative', () => {
    expect(getInventoryAgeDays('2026-07-15', asOf)).toBe(0);
  });

  it('accepts a Date object as well as an ISO string', () => {
    expect(getInventoryAgeDays(new Date('2026-06-09T00:00:00.000Z'), asOf)).toBe(30);
  });
});

describe('isAgingStock', () => {
  it('is false at exactly the 90-day threshold', () => {
    expect(isAgingStock(AGING_THRESHOLD_DAYS)).toBe(false);
  });

  it('is true one day past the threshold', () => {
    expect(isAgingStock(AGING_THRESHOLD_DAYS + 1)).toBe(true);
  });

  it('is false for a brand-new vehicle', () => {
    expect(isAgingStock(0)).toBe(false);
  });
});

describe('getAgingSeverity', () => {
  it.each([
    [0, 'fresh'],
    [30, 'fresh'],
    [31, 'watch'],
    [90, 'watch'],
    [91, 'aging'],
    [180, 'aging'],
    [181, 'critical'],
    [400, 'critical'],
  ])('classifies %i days as %s', (ageDays, expected) => {
    expect(getAgingSeverity(ageDays)).toBe(expected);
  });
});
