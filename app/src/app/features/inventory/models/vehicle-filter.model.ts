import { VehicleStatus } from './vehicle.model';

export interface VehicleFilter {
  search: string;
  make: string | null;
  model: string | null;
  status: VehicleStatus | null;
  agingOnly: boolean;
}

export const EMPTY_VEHICLE_FILTER: VehicleFilter = {
  search: '',
  make: null,
  model: null,
  status: null,
  agingOnly: false,
};
