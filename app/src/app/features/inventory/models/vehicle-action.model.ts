export type VehicleActionType =
  | 'price_reduction_planned'
  | 'marketing_push'
  | 'transfer_requested'
  | 'wholesale_auction'
  | 'manager_review';

export const VEHICLE_ACTION_LABELS: Record<VehicleActionType, string> = {
  price_reduction_planned: 'Price Reduction Planned',
  marketing_push: 'Marketing Push',
  transfer_requested: 'Transfer to Another Site',
  wholesale_auction: 'Wholesale / Auction',
  manager_review: 'Manager Review',
};

export interface VehicleAction {
  id: string;
  vehicleId: string; // == Vehicle.id / vin
  actionType: VehicleActionType;
  note: string;
  loggedBy: string;
  createdAt: string; // ISO datetime
}

// What the UI (ActionLogDialog) produces — no id, no createdAt. VehicleStore.logAction()
// stamps `createdAt` via ClockService before handing off to VehicleActionService, because
// json-server auto-generates `id` on POST but does NOT stamp `createdAt`, and the whole
// app relies on that field for latestAction/history ordering.
export type NewVehicleAction = Omit<VehicleAction, 'id' | 'createdAt'>;

// What VehicleActionService.logAction() actually sends over HTTP — a fully-formed action
// missing only the server-assigned `id`.
export type VehicleActionDraft = Omit<VehicleAction, 'id'>;
