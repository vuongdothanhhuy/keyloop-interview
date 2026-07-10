// mock-server/seed.ts
import { faker } from '@faker-js/faker';
import { writeFileSync } from 'node:fs';

faker.seed(42); // deterministic across regenerations

const DEALERSHIP_ID = 'DEALER-001';
// Anchored to real "now" at generation time, not a fixed historical date: the app's
// ClockService always reports real wall-clock time, so a fixed anchor here would silently
// drift out of sync with it (the "exactly 90 days, not aging" boundary vehicle would flip
// to aging the very next day after regenerating). Re-run `npm run seed` to refresh this
// anchor whenever you want the boundary-case vehicles to reflect "today" again — faker's
// fixed seed (below) still makes every other field deterministic across re-runs.
const TODAY = new Date();
const IMAGE_WIDTH = 400;
const IMAGE_HEIGHT = 300;

const MAKES_MODELS: Record<string, string[]> = {
  Toyota: ['Corolla', 'RAV4', 'Camry', 'Hilux'],
  Ford: ['Focus', 'Kuga', 'Fiesta', 'Ranger'],
  Volkswagen: ['Golf', 'Tiguan', 'Passat', 'T-Roc'],
  BMW: ['3 Series', 'X1', 'X3', '5 Series'],
  Hyundai: ['Tucson', 'i30', 'Kona'],
};

const BODY_TYPES = ['Sedan', 'SUV', 'Truck', 'Hatchback', 'Coupe', 'Van'] as const;
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'] as const;
const STATUSES = ['in_stock', 'in_stock', 'in_stock', 'reserved', 'sold'] as const; // weighted toward in_stock
const ACTION_TYPES = [
  'price_reduction_planned',
  'marketing_push',
  'transfer_requested',
  'wholesale_auction',
  'manager_review',
] as const;

function randomVin(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'; // VINs exclude I, O, Q
  return Array.from({ length: 17 }, () => faker.helpers.arrayElement(chars.split(''))).join('');
}

function daysAgo(days: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// Weighted age distribution so ~28% of stock is aging (>90 days), including
// deliberate boundary cases at exactly 90 and 91 days for manual QA.
function sampleAgeDays(index: number): number {
  if (index === 0) return 90; // boundary: NOT aging
  if (index === 1) return 91; // boundary: aging
  const bucket = faker.number.float({ min: 0, max: 1 });
  if (bucket < 0.55) return faker.number.int({ min: 0, max: 90 });
  if (bucket < 0.8) return faker.number.int({ min: 91, max: 180 });
  return faker.number.int({ min: 181, max: 400 });
}

const vehicles = Array.from({ length: 130 }, (_, i) => {
  const make = faker.helpers.arrayElement(Object.keys(MAKES_MODELS));
  const model = faker.helpers.arrayElement(MAKES_MODELS[make]);
  const vin = randomVin();
  return {
    id: vin,
    vin,
    make,
    model,
    trim: faker.helpers.arrayElement(['Base', 'Sport', 'Luxury', 'SE', 'GT']),
    year: faker.number.int({ min: 2021, max: 2026 }),
    color: faker.vehicle.color(),
    bodyType: faker.helpers.arrayElement(BODY_TYPES),
    fuelType: faker.helpers.arrayElement(FUEL_TYPES),
    mileage: faker.number.int({ min: 5, max: 25000 }),
    price: faker.number.int({ min: 12000, max: 65000 }),
    dealershipId: DEALERSHIP_ID,
    intakeDate: daysAgo(sampleAgeDays(i)),
    status: faker.helpers.arrayElement(STATUSES),
    imageUrl: `https://picsum.photos/seed/${vin}/${IMAGE_WIDTH}/${IMAGE_HEIGHT}`,
    imageWidth: IMAGE_WIDTH,
    imageHeight: IMAGE_HEIGHT,
  };
});

// A handful of aging vehicles get 1-3 historical actions logged already.
const vehicleActions = vehicles
  .filter((v) => {
    const ageDays = Math.floor((TODAY.getTime() - new Date(v.intakeDate).getTime()) / 86_400_000);
    return ageDays > 90;
  })
  .filter(() => faker.number.float({ min: 0, max: 1 }) < 0.6)
  .flatMap((v) => {
    const count = faker.number.int({ min: 1, max: 3 });
    return Array.from({ length: count }, (_, i) => ({
      id: faker.string.uuid(),
      vehicleId: v.id,
      actionType: faker.helpers.arrayElement(ACTION_TYPES),
      note: faker.lorem.sentence(),
      loggedBy: 'Alex Manager',
      createdAt: new Date(
        new Date(v.intakeDate).getTime() + (i + 1) * 5 * 86_400_000,
      ).toISOString(),
    }));
  });

writeFileSync(
  new URL('./db.json', import.meta.url),
  JSON.stringify({ vehicles, vehicleActions }, null, 2),
);

console.log(`Seeded ${vehicles.length} vehicles and ${vehicleActions.length} actions.`);
