import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'inventory', pathMatch: 'full' },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./features/inventory/feature/inventory-dashboard/inventory-dashboard').then(
        (m) => m.InventoryDashboard,
      ),
  },
  // 'inventory/:vin' is added in Task 19 once VehicleDetail exists.
];
