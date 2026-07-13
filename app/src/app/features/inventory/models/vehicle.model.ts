// app/src/app/features/inventory/models/vehicle.model.ts
export type VehicleStatus = 'in_stock' | 'reserved' | 'sold' | 'in_transit';

export type BodyType = 'Sedan' | 'SUV' | 'Truck' | 'Hatchback' | 'Coupe' | 'Van';

export type FuelType = 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';

export interface Vehicle {
  id: string; // == vin; json-server requires an `id` field on every resource
  vin: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  color: string;
  bodyType: BodyType;
  fuelType: FuelType;
  mileage: number;
  price: number;
  dealershipId: string;
  intakeDate: string; // ISO date (yyyy-MM-dd), date the vehicle entered inventory
  status: VehicleStatus;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
}
