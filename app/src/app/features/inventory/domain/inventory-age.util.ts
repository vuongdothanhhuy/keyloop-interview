// app/src/app/features/inventory/domain/inventory-age.util.ts
export const AGING_THRESHOLD_DAYS = 90;

export type AgingSeverity = 'fresh' | 'watch' | 'aging' | 'critical';

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Number of whole days between `intakeDate` and `asOf`, clamped to >= 0. */
export function getInventoryAgeDays(intakeDate: string | Date, asOf: Date): number {
  const intake = typeof intakeDate === 'string' ? new Date(intakeDate) : intakeDate;
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor(
    (startOfDay(asOf).getTime() - startOfDay(intake).getTime()) / msPerDay,
  );
  return Math.max(diffDays, 0);
}

/** Spec-mandated rule: strictly more than 90 days in inventory. */
export function isAgingStock(ageDays: number, thresholdDays = AGING_THRESHOLD_DAYS): boolean {
  return ageDays > thresholdDays;
}

/** UX-only severity banding layered on top of the binary aging rule. */
export function getAgingSeverity(ageDays: number): AgingSeverity {
  if (ageDays <= 30) return 'fresh';
  if (ageDays <= 90) return 'watch';
  if (ageDays <= 180) return 'aging';
  return 'critical';
}
